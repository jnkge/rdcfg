import { run, tryRun, commandExists } from '../utils/exec.js';
import { allHosts } from '../hosts/index.js';
import { getHost } from '../hosts/index.js';
import { recordCodegraphCli, recordCodegraphConnect, recordCodegraphDisconnect } from '../skills/manifest.js';
import { connectZCodeCodegraph, disconnectZCodeCodegraph } from './zcode-adapter.js';
import { isCliInstalled } from './detector.js';
import type { HostId, McpServerConfig } from '../types.js';
import { log } from '../utils/logger.js';

export const CODEGRAPH_NPM_PKG = '@colbymchenry/codegraph';
export const CODEGRAPH_MCP: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

/** codegraph install 命令原生支持的宿主 id（不含 zcode） */
const NATIVE_HOSTS: HostId[] = ['claude', 'codex', 'cursor', 'trae'];

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
    return {
      ok: false,
      message: `npm 全局安装失败：${e?.message || e}\n请手动运行: npm i -g ${CODEGRAPH_NPM_PKG}`,
    };
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
      // 失败时逐个标记，但不阻塞
      for (const id of nativeRequested) {
        results.push({ hostId: id, ok: false, message: `codegraph install 失败: ${r.stderr || '未知错误'}` });
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
  if (okHosts.length > 0) recordCodegraphConnect(okHosts);

  return results;
}

/**
 * 在项目内运行 codegraph init。
 */
export async function initProject(cwd: string = process.cwd()): Promise<{ ok: boolean; message: string }> {
  const r = await tryRun('codegraph', ['init'], { cwd });
  return { ok: r.success, message: r.success ? 'codegraph init 完成' : `init 失败: ${r.stderr}` };
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
  return {
    ok: r.success,
    message: r.success ? 'codegraph 已卸载，宿主配置已清理' : `卸载失败: ${r.stderr}`,
  };
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
