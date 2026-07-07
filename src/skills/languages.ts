import { listSkills } from './registry.js';

/** 支持的语言 ID（技术栈类别维度，非纯编程语言） */
export const LANGUAGES = ['frontend', 'python', 'go', 'php', 'flutter'] as const;
export type Language = (typeof LANGUAGES)[number];

/** 语言 ID → 中文展示名 */
export const LANGUAGE_LABELS: Record<Language, string> = {
  frontend: '前端',
  python: 'Python',
  go: 'Go',
  php: 'PHP',
  flutter: 'Flutter',
};

/** 是否合法语言 ID */
export function isLanguage(id: string): id is Language {
  return (LANGUAGES as readonly string[]).includes(id);
}

/** 列出所有语言及其下 skill 计数，供 UI 显示 hint */
export function listLanguages(): Array<{ id: Language; label: string; count: number }> {
  const skills = listSkills();
  return LANGUAGES.map(id => ({
    id,
    label: LANGUAGE_LABELS[id],
    count: skills.filter(s => s.language === id).length,
  }));
}
