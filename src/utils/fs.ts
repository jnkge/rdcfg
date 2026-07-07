import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
  readdirSync, statSync, copyFileSync, renameSync, rmSync,
} from 'node:fs';
import { dirname, join, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

export function pathExists(p: string): boolean {
  return existsSync(p);
}

export function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true });
}

export function readFileText(p: string): string {
  return readFileSync(p, 'utf8');
}

/**
 * 原子写入：先写 .tmp 再 rename，避免中途崩溃留下半成品。
 */
export function atomicWriteFile(p: string, content: string): void {
  const dir = dirname(p);
  ensureDir(dir);
  const tmp = p + '.tmp-' + process.pid;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, p);
}

/**
 * 递归拷贝目录（含子目录与文件）。
 */
export function copyDir(src: string, dst: string): void {
  if (!pathExists(src)) throw new Error(`源目录不存在: ${src}`);
  ensureDir(dst);
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dst, entry);
    if (statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

/**
 * 比较两个文件内容是否相同（基于 sha256）。
 */
export function filesEqual(a: string, b: string): boolean {
  if (!pathExists(a) || !pathExists(b)) return false;
  const ha = createHash('sha256').update(readFileSync(a)).digest('hex');
  const hb = createHash('sha256').update(readFileSync(b)).digest('hex');
  return ha === hb;
}

export function removeDir(p: string): void {
  if (pathExists(p)) rmSync(p, { recursive: true, force: true });
}

export function toAbsolute(p: string): string {
  return isAbsolute(p) ? p : join(process.cwd(), p);
}
