import { listSkills } from '../skills/registry.js';
import { getSkillEntry } from '../skills/manifest.js';
import { log } from '../utils/logger.js';

/** 合并显示全局清单 + 当前项目清单的安装标记 */
function installMark(name: string): string {
  const g = getSkillEntry(name, { scope: 'global' });
  const p = getSkillEntry(name, { scope: 'project' });
  const parts: string[] = [];
  if (g) parts.push(`[global] ${g.hosts.join(', ')}`);
  if (p) parts.push(`[project] ${p.hosts.join(', ')}`);
  return parts.length > 0 ? ` (已装: ${parts.join(' | ')})` : '';
}

export function runList(): void {
  const skills = listSkills();
  if (skills.length === 0) {
    log.warn('未找到内置 skills');
    return;
  }
  // 按 category 分组
  const byCat = new Map<string, typeof skills>();
  for (const s of skills) {
    if (!byCat.has(s.category)) byCat.set(s.category, []);
    byCat.get(s.category)!.push(s);
  }
  for (const [cat, items] of byCat) {
    console.log(`\n[${cat}]`);
    for (const s of items) {
      console.log(`  ${s.name}${installMark(s.name)}`);
      if (s.description) console.log(`    ${s.description}`);
    }
  }
}
