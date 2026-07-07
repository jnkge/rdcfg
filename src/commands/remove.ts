import { removeSkill } from '../skills/installer.js';
import { removeSkillRecord, getSkillEntry } from '../skills/manifest.js';
import { allHosts } from '../hosts/index.js';
import { selectHosts, intro, outro, cancel } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import type { HostId, Scope } from '../types.js';

export interface RemoveOptions {
  hosts?: HostId[];
  scope?: Scope;
  cwd?: string;
}

export async function runRemove(names: string[], opts: RemoveOptions = {}): Promise<void> {
  let targetHosts = opts.hosts;
  const interactive = !targetHosts;
  if (interactive) {
    intro();
    const selected = await selectHosts(allHosts);
    if (selected === null) return cancel('已取消');
    targetHosts = selected;
  }
  const mopts = { scope: opts.scope, cwd: opts.cwd };
  for (const name of names) {
    const results = removeSkill(name, targetHosts!, mopts);
    for (const r of results) {
      r.removed ? log.ok(`${name} → ${r.hostId} 已移除`) : log.info(`${name} → ${r.hostId} 不存在`);
    }
    // 更新清单：从这些宿主移除记录
    const entry = getSkillEntry(name, mopts);
    if (entry) {
      const remaining = entry.hosts.filter(h => !targetHosts!.includes(h));
      if (remaining.length === 0) removeSkillRecord(name, mopts);
      else {
        removeSkillRecord(name, mopts);
        if (remaining.length > 0) {
          const { recordSkillInstall } = await import('../skills/manifest.js');
          recordSkillInstall(name, remaining, mopts);
        }
      }
    }
  }
  if (interactive) outro('完成');
}
