import { removeSkill } from '../skills/installer.js';
import { removeSkillRecord, getSkillEntry } from '../skills/manifest.js';
import { allHosts } from '../hosts/index.js';
import { selectHosts, p, intro, outro, cancel } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import type { HostId } from '../types.js';

export async function runRemove(names: string[], hostIds?: HostId[]): Promise<void> {
  let targetHosts = hostIds;
  const interactive = !targetHosts;
  if (interactive) {
    intro();
    const selected = await selectHosts(allHosts);
    if (selected === null) return cancel('已取消');
    targetHosts = selected;
  }
  for (const name of names) {
    const results = removeSkill(name, targetHosts!);
    for (const r of results) {
      r.removed ? log.ok(`${name} → ${r.hostId} 已移除`) : log.info(`${name} → ${r.hostId} 不存在`);
    }
    // 更新清单：从这些宿主移除记录
    const entry = getSkillEntry(name);
    if (entry) {
      const remaining = entry.hosts.filter(h => !targetHosts!.includes(h));
      if (remaining.length === 0) removeSkillRecord(name);
      else {
        // 重写记录
        const { recordSkillInstall } = await import('../skills/manifest.js');
        // 直接清空再记剩余不优雅；manifest 模块后续可加 setSkillHosts，此处简化用 removeSkillRecord + 重记
        removeSkillRecord(name);
        if (remaining.length > 0) recordSkillInstall(name, remaining);
      }
    }
  }
  if (interactive) outro('完成');
}
