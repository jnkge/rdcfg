import { detectCodegraph } from '../codegraph/detector.js';
import { installAll, connectHosts, uninstallCodegraph } from '../codegraph/installer.js';
import { getAvailableHosts, allHosts, getHost } from '../hosts/index.js';
import { selectHosts, confirmInitProject, intro, outro, cancel, p } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import type { HostId } from '../types.js';

export async function runCodegraphStatus(): Promise<void> {
  const status = await detectCodegraph();
  log.step('codegraph 状态');
  status.cliInstalled
    ? log.ok(`CLI 已安装（${status.cliVersion || 'version unknown'}）`)
    : log.fail('CLI 未安装');
  if (status.connectedHosts.length > 0) {
    log.ok(`已连接宿主: ${status.connectedHosts.map(id => getHost(id).displayName).join(', ')}`);
  } else {
    log.info('未连接任何宿主');
  }
  status.projectInitialized
    ? log.ok('当前项目已 codegraph init')
    : log.info('当前项目未 init（.codegraph/ 不存在）');
}

export async function runCodegraphInstall(hostIds?: HostId[]): Promise<void> {
  let targetHosts = hostIds;
  let doInit = false;
  const interactive = !targetHosts;
  if (interactive) {
    intro();
    const available = getAvailableHosts();
    const pool = available.length > 0 ? available : allHosts;
    const selected = await selectHosts(pool, available.map(h => h.id));
    if (selected === null) return cancel('已取消');
    targetHosts = selected;
    const init = await confirmInitProject();
    if (init === null) return cancel('已取消');
    doInit = init;
  }
  await installAll(targetHosts!, { initProject: doInit });
  if (interactive) outro('codegraph 配置完成。重启对应宿主以加载 MCP server。');
}

export async function runCodegraphUninstall(): Promise<void> {
  intro();
  const ans = await p.confirm({ message: '确认卸载 codegraph CLI 并清理所有宿主配置？', initialValue: false });
  if (p.isCancel(ans)) return cancel('已取消');
  if (!ans) { outro('已取消'); return; }
  const r = await uninstallCodegraph(['zcode', 'claude', 'codex', 'cursor', 'trae']);
  r.ok ? log.ok(r.message) : log.fail(r.message);
  outro('完成');
}
