import { listSkills } from '../skills/registry.js';
import { installSkill } from '../skills/installer.js';
import { recordSkillInstall } from '../skills/manifest.js';
import { getAvailableHosts, allHosts } from '../hosts/index.js';
import { installAll } from '../codegraph/installer.js';
import { detectCodegraph } from '../codegraph/detector.js';
import { selectSkills, selectHosts, confirmCodegraph, confirmInitProject, intro, outro, cancel } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import type { HostId } from '../types.js';

export async function runWizard(): Promise<void> {
  intro();

  // 1. skills 选择
  const skills = listSkills();
  const selectedSkills = await selectSkills(skills);
  if (selectedSkills === null) return cancel('已取消');

  // 2. 宿主选择
  const available = getAvailableHosts();
  const pool = available.length > 0 ? available : allHosts;
  const defaultHosts = available.map(h => h.id);
  const hostIds = await selectHosts(pool, defaultHosts);
  if (hostIds === null) return cancel('已取消');

  // 3. codegraph?
  const wantCodegraph = await confirmCodegraph();
  if (wantCodegraph === null) return cancel('已取消');

  let doInit = false;
  if (wantCodegraph) {
    const init = await confirmInitProject();
    if (init === null) return cancel('已取消');
    doInit = init;
  }

  // 4. 执行 skills 安装
  if (selectedSkills.length > 0) {
    log.step('安装 skills');
    for (const name of selectedSkills) {
      try {
        const results = installSkill(name, hostIds);
        for (const r of results) {
          if (r.outcome === 'installed') log.ok(`${name} → ${r.hostId}`);
          else if (r.outcome === 'skipped-same') log.info(`${name} → ${r.hostId} 已是最新`);
          else if (r.outcome === 'skipped-modified') log.warn(`${name} → ${r.hostId} 已修改跳过`);
        }
        recordSkillInstall(name, hostIds);
      } catch (e: any) {
        log.fail(`${name}: ${e?.message || e}`);
      }
    }
  }

  // 5. 执行 codegraph
  if (wantCodegraph) {
    log.step('配置 codegraph');
    await installAll(hostIds, { initProject: doInit });
  }

  // 6. 汇总
  outro('完成。重启对应宿主以加载 skills 与 MCP server。');
}
