import { run, tryRun } from '../utils/exec.js';
import { getHost } from '../hosts/index.js';
import { recordCodegraphCli, recordCodegraphConnect, recordCodegraphDisconnect } from '../skills/manifest.js';
import { connectZCodeCodegraph, disconnectZCodeCodegraph } from './zcode-adapter.js';
import { isCliInstalled, getConnectedHosts } from './detector.js';
import type { HostId } from '../types.js';
import { log } from '../utils/logger.js';

export const CODEGRAPH_NPM_PKG = '@colbymchenry/codegraph';

/** codegraph install 命令原生支持的宿主 id（不含 zcode） */
const NATIVE_HOSTS: HostId[] = ['claude', 'codex', 'cursor', 'trae'];

/**
 * 根据 npm/系统错误特征给出针对性建议。
 * 匹配 stdout+stderr 合并文本，命中即返回提示（多条件时取首个）。
 */
function diagnoseNpmError(combined: string): string | null {
  const text = combined.toLowerCase();
  // 权限：EACCES / EPERM，常见于系统级 prefix（/usr/local）
  if (text.includes('eacces') || text.includes('eperm')) {
    return '权限不足（EACCES）。建议：改用非系统 npm prefix，或加 sudo / 以管理员运行。' +
      '\n  - 设置用户级 prefix: npm config set prefix ~/.npm-global（并加入 PATH）' +
      `\n  - 或直接: sudo npm i -g ${CODEGRAPH_NPM_PKG}`;
  }
  // 网络：超时 / 连接重置 / DNS
  if (text.includes('etimedout') || text.includes('econnreset') || text.includes('enotfound') || text.includes('eai_again')) {
    return '网络异常。建议：检查网络/代理，或切换 registry:' +
      '\n  - npm config set registry https://registry.npmmirror.com';
  }
  // 包名/registry：404 找不到
  if (text.includes('404') || (text.includes('not found') && text.includes(CODEGRAPH_NPM_PKG.toLowerCase()))) {
    return `未在 registry 找到包 ${CODEGRAPH_NPM_PKG}（404）。确认包名/版本，或换 registry。`;
  }
  // 磁盘空间
  if (text.includes('enospc') || text.includes('no space left')) {
    return '磁盘空间不足（ENOSPC）。请清理后重试。';
  }
  // codegraph 不在 PATH（install 成功但子进程找不到）
  if (text.includes('enoent') && text.includes('codegraph')) {
    return '安装可能成功但 codegraph 未在 PATH。请重开终端使 PATH 生效，或检查 npm bin -g 目录是否在 PATH 中。';
  }
  return null;
}

/**
 * 把 tryRun 的完整输出（stdout + stderr + exitCode）拼成可读字符串。
 */
function formatRunFailure(stdout: string, stderr: string, exitCode: number | null): string {
  const parts: string[] = [];
  if (exitCode !== null) parts.push(`退出码 ${exitCode}`);
  const detail = [stdout, stderr].filter(Boolean).join('\n').trim();
  if (detail) parts.push(`输出:\n${detail}`);
  return parts.length > 0 ? parts.join(' | ') : '未知错误';
}

/**
 * 安装 codegraph CLI（npm i -g）。
 */
export async function installCli(): Promise<{ ok: boolean; message: string }> {
  const existing = await isCliInstalled();
  if (existing.installed) {
    return { ok: true, message: `codegraph 已安装（${existing.version || 'unknown'}），跳过` };
  }
  try {
    await run('npm', ['install', '-g', CODEGRAPH_NPM_PKG], { timeout: 120000 });
    recordCodegraphCli(true);
    return { ok: true, message: 'codegraph CLI 安装成功' };
  } catch (e: any) {
    const stdout: string = e?.stdout || '';
    const stderr: string = e?.stderr || '';
    const combined = `${stdout}\n${stderr}`;
    const hint = diagnoseNpmError(combined);
    const lines = [
      `npm 全局安装失败${e?.exitCode !== undefined ? `（退出码 ${e.exitCode}）` : ''}。`,
    ];
    const detail = combined.trim();
    if (detail) lines.push(`--- npm 输出 ---\n${detail}`);
    if (hint) lines.push(`--- 建议 ---\n${hint}`);
    lines.push(`可手动重试: npm i -g ${CODEGRAPH_NPM_PKG}`);
    return { ok: false, message: lines.join('\n') };
  }
}

/**
 * 连接 codegraph 到指定宿主。
 * - 原生宿主（claude/codex/cursor/trae）：调 `codegraph install`
 * - ZCode：调 zcode-adapter 写 MCP 配置
 */
export async function connectHosts(hostIds: HostId[]): Promise<{ hostId: HostId; ok: boolean; message: string }[]> {
  const results: { hostId: HostId; ok: boolean; message: string }[] = [];
  const requested = new Set(hostIds);

  // 原生宿主批量交给 codegraph install
  const nativeRequested = hostIds.filter(id => NATIVE_HOSTS.includes(id));
  if (nativeRequested.length > 0) {
    const r = await tryRun('codegraph', ['install']);
    if (r.success) {
      for (const id of nativeRequested) {
        results.push({ hostId: id, ok: true, message: '已通过 codegraph install 连接' });
      }
    } else {
      // 失败时把完整输出贴到每个原生宿主上（codegraph install 一次操作所有原生宿主，无法逐个定位）
      const detail = formatRunFailure(r.stdout, r.stderr, r.exitCode);
      for (const id of nativeRequested) {
        results.push({ hostId: id, ok: false, message: `codegraph install 失败: ${detail}` });
      }
    }
  }

  // ZCode 单独适配
  if (requested.has('zcode')) {
    try {
      await connectZCodeCodegraph();
      results.push({ hostId: 'zcode', ok: true, message: '已写入 ZCode MCP 配置' });
    } catch (e: any) {
      results.push({ hostId: 'zcode', ok: false, message: `ZCode 适配失败: ${e?.message || e}` });
    }
  }

  // 记录成功的到 manifest
  const okHosts = results.filter(r => r.ok).map(r => r.hostId);
  if (okHosts.length > 0) {
    // 不直接记 nativeRequested，而是回查实际写入的 MCP 配置，确认真实连接状态。
    let confirmed = okHosts;
    try {
      const connected = new Set(await getConnectedHosts());
      // 回查命中 + ZCode/非原生宿主按执行结果（getConnectedHosts 已覆盖读得到的所有宿主）
      confirmed = okHosts.filter(id => connected.has(id));
    } catch {
      // 回查失败时退回执行结果
    }
    if (confirmed.length > 0) recordCodegraphConnect(confirmed);
  }

  return results;
}

/**
 * 在项目内运行 codegraph init。
 */
export async function initProject(cwd: string = process.cwd()): Promise<{ ok: boolean; message: string }> {
  const r = await tryRun('codegraph', ['init'], { cwd });
  if (r.success) return { ok: true, message: 'codegraph init 完成' };
  return { ok: false, message: `init 失败: ${formatRunFailure(r.stdout, r.stderr, r.exitCode)}` };
}

/**
 * 卸载 codegraph：解绑所有宿主（含 ZCode）+ npm uninstall -g。
 */
export async function uninstallCodegraph(hostIds: HostId[]): Promise<{ ok: boolean; message: string }> {
  // 1. 解绑 ZCode（rdcfg 写的，rdcfg 撤）
  if (hostIds.includes('zcode')) {
    try { await disconnectZCodeCodegraph(); } catch { /* 忽略 */ }
  }
  // 2. 原生宿主由 codegraph preuninstall 钩子清理，但显式记录
  recordCodegraphDisconnect(hostIds);
  // 3. npm uninstall -g（触发 preuninstall 清理原生宿主配置）
  const r = await tryRun('npm', ['uninstall', '-g', CODEGRAPH_NPM_PKG]);
  recordCodegraphCli(false);
  if (r.success) return { ok: true, message: 'codegraph 已卸载，宿主配置已清理' };
  return { ok: false, message: `卸载失败: ${formatRunFailure(r.stdout, r.stderr, r.exitCode)}` };
}

/**
 * 编排：装 CLI → 连接宿主 → （可选）init 项目。
 */
export async function installAll(
  hostIds: HostId[],
  opts: { initProject?: boolean; cwd?: string } = {}
): Promise<void> {
  log.step('1/3 安装 codegraph CLI');
  const cli = await installCli();
  cli.ok ? log.ok(cli.message) : log.fail(cli.message);
  if (!cli.ok) return;

  log.step('2/3 连接宿主');
  const results = await connectHosts(hostIds);
  for (const r of results) {
    r.ok ? log.ok(`${getHost(r.hostId).displayName}: ${r.message}`) : log.fail(`${getHost(r.hostId).displayName}: ${r.message}`);
  }

  if (opts.initProject) {
    log.step('3/3 初始化当前项目');
    const init = await initProject(opts.cwd);
    init.ok ? log.ok(init.message) : log.warn(init.message);
  }
}
