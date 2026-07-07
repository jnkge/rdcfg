import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  pathExists, ensureDir, readFileText, atomicWriteFile, copyDir, filesEqual, removeDir,
} from '../../src/utils/fs.js';

let work: string;
beforeEach(() => { work = mkdtempSync(join(tmpdir(), 'rdcfg-fs-')); });

describe('fs utils', () => {
  it('ensureDir 创建多级目录', () => {
    const p = join(work, 'a/b/c');
    ensureDir(p);
    expect(pathExists(p)).toBe(true);
  });

  it('atomicWriteFile 写入并可读回', () => {
    const p = join(work, 'f.json');
    atomicWriteFile(p, '{"a":1}');
    expect(readFileText(p)).toBe('{"a":1}');
  });

  it('atomicWriteFile 不留 tmp 残留', () => {
    const p = join(work, 'g.json');
    atomicWriteFile(p, 'x');
    const files = readdirSync(work);
    expect(files).toEqual(['g.json']);
  });

  it('copyDir 递归拷贝子目录与文件', () => {
    const src = join(work, 'src');
    ensureDir(join(src, 'sub'));
    atomicWriteFile(join(src, 'top.txt'), 'top');
    atomicWriteFile(join(src, 'sub', 'deep.txt'), 'deep');
    const dst = join(work, 'dst');
    copyDir(src, dst);
    expect(pathExists(join(dst, 'top.txt'))).toBe(true);
    expect(pathExists(join(dst, 'sub', 'deep.txt'))).toBe(true);
    expect(readFileText(join(dst, 'sub', 'deep.txt'))).toBe('deep');
  });

  it('filesEqual 相同内容返回 true', () => {
    const a = join(work, 'a.txt'); const b = join(work, 'b.txt');
    atomicWriteFile(a, 'hello'); atomicWriteFile(b, 'hello');
    expect(filesEqual(a, b)).toBe(true);
  });

  it('filesEqual 不同内容返回 false', () => {
    const a = join(work, 'a.txt'); const b = join(work, 'b.txt');
    atomicWriteFile(a, 'hello'); atomicWriteFile(b, 'world');
    expect(filesEqual(a, b)).toBe(false);
  });

  it('removeDir 删除目录', () => {
    const p = join(work, 'gone');
    ensureDir(p); atomicWriteFile(join(p, 'x'), 'y');
    removeDir(p);
    expect(pathExists(p)).toBe(false);
  });
});
