import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync } from 'node:fs';
import { pathExists, readFileText } from '../utils/fs.js';
import type { Skill } from '../types.js';

/**
 * 内置 skills 目录。打包后 dist/cli.js 的同级有 skills/，
 * 开发期从项目根 skills/ 读。
 */
function skillsRoot(): string {
  // ESM 下 __dirname 推导
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/ 上一级找 skills/；找不到则回退 cwd
  const candidates = [
    join(here, '..', 'skills'), // 开发: dist/../skills
    join(here, '..', '..', 'skills'), // 打包后可能更深
    join(process.cwd(), 'skills'),
  ];
  for (const c of candidates) {
    if (pathExists(c)) return c;
  }
  return candidates[0];
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
