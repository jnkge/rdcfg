import { listSkills } from '../skills/registry.js';
import { getSkillEntry } from '../skills/manifest.js';
import { log } from '../utils/logger.js';

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
      const entry = getSkillEntry(s.name);
      const installedMark = entry ? ` (已装: ${entry.hosts.join(', ')})` : '';
      console.log(`  ${s.name}${installedMark}`);
      if (s.description) console.log(`    ${s.description}`);
    }
  }
}
