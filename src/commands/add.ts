import { listSkills } from '../skills/registry.js';
import { installSkill } from '../skills/installer.js';
import { recordSkillInstall } from '../skills/manifest.js';
import { getAvailableHosts, allHosts } from '../hosts/index.js';
import { selectHosts, selectSkills, intro, outro, cancel } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import type { HostId } from '../types.js';

export interface AddOptions {
  hosts?: HostId[];      // 非交互指定
  force?: boolean;
}

export async function runAdd(names: string[], opts: AddOptions = {}): Promise<void> {
  let skillNames = names;
  let hostIds = opts.hosts;

  // 交互模式：未指定 names 或 hosts
  const interactive = skillNames.length === 0 || !hostIds;
  if (interactive) {
    intro();
    if (skillNames.length === 0) {
      const selected = await selectSkills(listSkills());
      if (selected === null) return cancel('已取消');
      skillNames = selected;
    }
    if (!hostIds) {
      const available = getAvailableHosts();
      const pool = available.length > 0 ? available : allHosts;
      const defaultIds = available.map(h => h.id);
      const selected = await selectHosts(pool, defaultIds);
      if (selected === null) return cancel('已取消');
      hostIds = selected;
    }
  }

  if (skillNames.length === 0) {
    log.info('未选择任何 skill');
    if (interactive) outro('完成');
    return;
  }

  for (const name of skillNames) {
    try {
      const results = installSkill(name, hostIds!, { force: opts.force });
      for (const r of results) {
        const hostLabel = r.hostId;
        if (r.outcome === 'installed') log.ok(`${name} → ${hostLabel} 已安装`);
        else if (r.outcome === 'skipped-same') log.info(`${name} → ${hostLabel} 已是最新`);
        else if (r.outcome === 'skipped-modified') log.warn(`${name} → ${hostLabel} 已被修改，跳过（--force 覆盖）`);
        else if (r.outcome === 'overwritten') log.ok(`${name} → ${hostLabel} 已覆盖（备份: ${r.backupPath}）`);
      }
      recordSkillInstall(name, hostIds!);
    } catch (e: any) {
      log.fail(`${name}: ${e?.message || e}`);
    }
  }
  if (interactive) outro(`完成。重启对应宿主以加载新 skills。`);
}
