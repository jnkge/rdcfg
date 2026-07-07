import { updateSkill } from '../skills/installer.js';
import { listSkills } from '../skills/registry.js';
import { getAvailableHosts, allHosts } from '../hosts/index.js';
import { getSkillEntry } from '../skills/manifest.js';
import { log } from '../utils/logger.js';
import { selectHosts, intro, outro, cancel } from '../ui/prompts.js';
import type { HostId, Scope } from '../types.js';

export interface UpdateOptions {
  hosts?: HostId[];
  scope?: Scope;
  cwd?: string;
}

export async function runUpdate(names: string[], opts: UpdateOptions = {}): Promise<void> {
  let targetNames = names;
  let targetHosts = opts.hosts;
  const mopts = { scope: opts.scope, cwd: opts.cwd };
  const interactive = targetNames.length === 0 || !targetHosts;
  if (interactive) {
    intro();
    if (targetNames.length === 0) {
      // 默认更新所有已安装的
      const installed = listSkills().filter(s => getSkillEntry(s.name, mopts));
      targetNames = installed.map(s => s.name);
      if (targetNames.length === 0) { log.warn('没有已安装的 skill 可更新'); outro('完成'); return; }
    }
    if (!targetHosts) {
      const available = getAvailableHosts();
      const pool = available.length > 0 ? available : allHosts;
      const selected = await selectHosts(pool, available.map(h => h.id));
      if (selected === null) return cancel('已取消');
      targetHosts = selected;
    }
  }
  for (const name of targetNames) {
    const results = updateSkill(name, targetHosts!, mopts);
    for (const r of results) {
      if (r.outcome === 'overwritten') log.ok(`${name} → ${r.hostId} 已更新（备份: ${r.backupPath}）`);
      else if (r.outcome === 'installed') log.ok(`${name} → ${r.hostId} 已安装`);
      else log.info(`${name} → ${r.hostId} ${r.outcome}`);
    }
  }
  if (interactive) outro('更新完成');
}
