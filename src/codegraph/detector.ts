import { join } from 'node:path';
import { commandExists, tryRun } from '../utils/exec.js';
import { pathExists } from '../utils/fs.js';
import { allHosts } from '../hosts/index.js';
import type { CodegraphStatus, HostId } from '../types.js';

/**
 * codegraph CLI 是否安装，以及版本。
 * 依赖真实 PATH，单元测试不覆盖（留给 Task 17 E2E mock）。
 */
export async function isCliInstalled(): Promise<{ installed: boolean; version: string | null }> {
  if (!(await commandExists('codegraph'))) return { installed: false, version: null };
  const r = await tryRun('codegraph', ['--version']);
  return { installed: true, version: r.success ? r.stdout : null };
}

/**
 * 检查各宿主 MCP 配置里是否已有 codegraph 条目。
 * 遍历 allHosts，读每个 host 的 MCP 配置，检查是否有 codegraph server。
 * 两种 key 形态：mcpServers（claude/cursor/trae）或 mcp.servers（zcode）。
 */
export async function getConnectedHosts(): Promise<HostId[]> {
  const connected: HostId[] = [];
  for (const host of allHosts) {
    try {
      const cfg = await host.readMcpConfig();
      const servers = (cfg as any)?.mcpServers || (cfg as any)?.mcp?.servers || {};
      if (servers && typeof servers === 'object' && 'codegraph' in servers) {
        connected.push(host.id);
      }
    } catch {
      // 配置读不出来视为未连
    }
  }
  return connected;
}

/**
 * 当前项目是否已 codegraph init（存在 codegraph.db）。
 *
 * 优先级：显式传入的 cwd 以该项目目录下的 .codegraph 为准；
 * 默认调用（cwd === process.cwd()，如 detectCodegraph）则允许
 * CODEGRAPH_DIR 环境变量把检测路径重定向到别处（测试隔离亦用此机制）。
 */
export function isProjectInitialized(cwd: string = process.cwd()): boolean {
  const dir =
    cwd === process.cwd()
      ? (process.env.CODEGRAPH_DIR ?? join(cwd, '.codegraph'))
      : join(cwd, '.codegraph');
  return pathExists(join(dir, 'codegraph.db'));
}

/**
 * 三层检测一次性汇总，供向导展示当前状态。
 */
export async function detectCodegraph(): Promise<CodegraphStatus> {
  const cli = await isCliInstalled();
  const connectedHosts = await getConnectedHosts();
  return {
    cliInstalled: cli.installed,
    cliVersion: cli.version,
    connectedHosts,
    projectInitialized: isProjectInitialized(),
  };
}
