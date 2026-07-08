import { listSkills } from '../skills/registry.js';
import { installSkill } from '../skills/installer.js';
import { recordSkillInstall } from '../skills/manifest.js';
import { getAvailableHosts, allHosts } from '../hosts/index.js';
import { installAll } from '../codegraph/installer.js';
import { selectSkills, selectHosts, selectScope, selectLanguage, confirmCodegraph, confirmInitProject, intro, outro, cancel } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import type { HostId, Scope } from '../types.js';

export async function runWizard(): Promise<void> {
  intro();

  // 0. 安装作用域
  const scope: Scope | null = await selectScope();
  if (scope === null) return cancel('已取消');

  // 0.5 选择语言
  const language = await selectLanguage();
  if (language === null) return cancel('已取消');

  // 1. skills 选择（按语言过滤）
  const skills = listSkills().filter(s => s.language === language);
  if (skills.length === 0) return cancel(`该语言（${language}）暂无 skills，敬请期待`);
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
    const scopeTag = scope === 'project' ? '[project] ' : '';
    for (const name of selectedSkills) {
      try {
        const results = installSkill(name, hostIds, { scope });
        for (const r of results) {
          if (r.outcome === 'installed') log.ok(`${scopeTag}${name} → ${r.hostId}`);
          else if (r.outcome === 'skipped-same') log.info(`${scopeTag}${name} → ${r.hostId} 已是最新`);
          else if (r.outcome === 'skipped-modified') log.warn(`${scopeTag}${name} → ${r.hostId} 已修改跳过`);
        }
        recordSkillInstall(name, hostIds, { scope });
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
  const tail = scope === 'project'
    ? '完成。skills 已装入当前项目目录，可随项目 commit。重启对应宿主以加载。'
    : '完成。重启对应宿主以加载 skills 与 MCP server。';
  outro(tail);
}
