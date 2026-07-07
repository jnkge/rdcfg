import { allHosts } from '../hosts/index.js';
import { commandExists } from '../utils/exec.js';
import { detectCodegraph } from '../codegraph/detector.js';
import { log } from '../utils/logger.js';

export async function runDoctor(): Promise<void> {
  log.step('环境体检');
  // Node 版本
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  nodeMajor >= 20 ? log.ok(`Node ${process.version}`) : log.fail(`Node ${process.version}（需 >= 20）`);

  // 宿主
  for (const h of allHosts) {
    h.isAvailable() ? log.ok(`${h.displayName} 已安装`) : log.info(`${h.displayName} 未检测到`);
  }

  // codegraph
  const cg = await detectCodegraph();
  cg.cliInstalled ? log.ok(`codegraph CLI 已安装`) : log.info('codegraph CLI 未安装');

  // 包管理器
  const npmOk = await commandExists('npm');
  npmOk ? log.ok('npm 可用') : log.fail('npm 不可用');
}
