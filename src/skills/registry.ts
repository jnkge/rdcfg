import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync } from 'node:fs';
import { pathExists, readFileText } from '../utils/fs.js';
import type { Skill } from '../types.js';

/**
 * 内置 skills 目录。打包后 dist/cli.js 的同级有 skills/，
 * 开发期从项目根 skills/ 读。
 */
function hasSkillEntries(dir: string): boolean {
  if (!pathExists(dir)) return false;
  try {
    return readdirSync(dir).some((name) => {
      const sub = join(dir, name);
      return statSync(sub).isDirectory() && pathExists(join(sub, 'SKILL.md'));
    });
  } catch {
    return false;
  }
}

function skillsRoot(): string {
  // ESM 下 __dirname 推导
  const here = dirname(fileURLToPath(import.meta.url));
  // 候选 skills 目录：
  // - 开发期 here = <root>/src/skills → 需要 <root>/skills（上两级再拼 skills）
  // - 打包后（tsup 扁平输出到 dist/）here = <root>/dist → 需要 <root>/skills（上一级再拼）
  // 用 hasSkillEntries 校验，避免命中源码目录（src/skills 只含 .ts，无 SKILL.md）
  const candidates = [
    join(here, '..', 'skills'), // 打包: dist/../skills
    join(here, '..', '..', 'skills'), // 开发: src/skills/../../skills
    join(process.cwd(), 'skills'),
  ];
  for (const c of candidates) {
    if (hasSkillEntries(c)) return c;
  }
  // 兜底：第一个存在的候选
  return candidates.find((c) => pathExists(c)) ?? candidates[0];
}

export interface ParsedFrontmatter {
  data: Record<string, string>;
  body: string;
}

/**
 * 解析 --- 包裹的 YAML frontmatter（轻量手写，避免引依赖）。
 * 仅支持平铺 key: value。
 */
export function parseFrontmatter(text: string): ParsedFrontmatter {
  const fm: Record<string, string> = {};
  let body = text;
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (match) {
    const yamlBlock = match[1];
    body = match[2];
    for (const line of yamlBlock.split(/\r?\n/)) {
      const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
      if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return { data: fm, body };
}

export function listSkills(): Skill[] {
  const root = skillsRoot();
  if (!pathExists(root)) return [];
  const skills: Skill[] = [];
  for (const name of readdirSync(root)) {
    const dir = join(root, name);
    if (!statSync(dir).isDirectory()) continue;
    const md = join(dir, 'SKILL.md');
    if (!pathExists(md)) continue;
    const { data } = parseFrontmatter(readFileText(md));
    skills.push({
      name: data.name || name,
      description: data.description || '',
      category: data.category || 'other',
      source: data.source || '',
      dir,
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function getSkill(name: string): Skill | undefined {
  return listSkills().find((s) => s.name === name);
}
