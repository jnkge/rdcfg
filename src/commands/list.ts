import { listSkills } from '../skills/registry.js';
import { getSkillEntry } from '../skills/manifest.js';
import { LANGUAGE_LABELS } from '../skills/languages.js';
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
  // 按 language 分组（语言 > category 双维度）
  const byLang = new Map<string, typeof skills>();
  for (const s of skills) {
    const key = s.language || 'other';
    if (!byLang.has(key)) byLang.set(key, []);
    byLang.get(key)!.push(s);
  }
  // 固定语言顺序（list 全览含 other 兜底；add/wizard 筛选用 LANGUAGES，不含 other）
  const order = ['frontend', 'python', 'go', 'php', 'flutter', 'other'];
  for (const lang of order) {
    const items = byLang.get(lang);
    if (!items || items.length === 0) continue;
    const label = LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS] || lang;
    console.log(`\n[${label}]`);
    for (const s of items) {
      console.log(`  ${s.name} (${s.category})${installMark(s.name)}`);
      if (s.description) console.log(`    ${s.description}`);
    }
  }
}
