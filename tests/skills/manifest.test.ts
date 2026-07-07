import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useTmpHome } from '../helpers/tmp-home.js';
import { pathExists } from '../../src/utils/fs.js';
import {
  loadManifest, saveManifest, recordSkillInstall, recordCodegraphConnect,
  recordCodegraphCli, removeSkillRecord, getSkillEntry, emptyManifest, manifestPath,
  projectManifestPath,
} from '../../src/skills/manifest.js';

useTmpHome();

describe('manifest', () => {
  it('空环境 loadManifest 返回空清单', () => {
    const m = loadManifest();
    expect(m.skills).toEqual([]);
    expect(m.codegraph.cliInstalled).toBe(false);
  });

  it('recordSkillInstall 写入并可读回', () => {
    recordSkillInstall('vue-best-practices', ['zcode', 'claude']);
    const entry = getSkillEntry('vue-best-practices');
    expect(entry).toBeDefined();
    expect(entry!.hosts).toEqual(['zcode', 'claude']);
  });

  it('重复 record 合并不重复', () => {
    recordSkillInstall('vue', ['zcode']);
    recordSkillInstall('vue', ['zcode', 'claude']);
    const entry = getSkillEntry('vue')!;
    expect(entry.hosts).toEqual(['zcode', 'claude']);
  });

  it('recordCodegraphConnect 合并宿主', () => {
    recordCodegraphConnect(['zcode', 'cursor']);
    const m = loadManifest();
    expect(m.codegraph.connectedHosts).toEqual(['zcode', 'cursor']);
  });

  it('recordCodegraphCli 设置状态', () => {
    recordCodegraphCli(true);
    expect(loadManifest().codegraph.cliInstalled).toBe(true);
  });

  it('removeSkillRecord 删除条目', () => {
    recordSkillInstall('vue', ['zcode']);
    removeSkillRecord('vue');
    expect(getSkillEntry('vue')).toBeUndefined();
  });

  it('清单写入 ~/.rdcfg/manifest.json', () => {
    saveManifest(emptyManifest());
    expect(pathExists(manifestPath())).toBe(true);
  });
});

describe('manifest (project scope)', () => {
  let cwd: string;
  beforeEach(() => { cwd = mkdtempSync(join(tmpdir(), 'rdcfg-proj-')); });

  it('project 级记录写入 <cwd>/.rdcfg/manifest.json 而非家目录', () => {
    recordSkillInstall('vue', ['zcode'], { scope: 'project', cwd });
    expect(pathExists(projectManifestPath(cwd))).toBe(true);
    // 全局清单不应被创建
    expect(pathExists(manifestPath())).toBe(false);
  });

  it('project 与 global 清单互相隔离', () => {
    recordSkillInstall('vue', ['zcode'], { scope: 'project', cwd });
    recordSkillInstall('vue', ['claude'], { scope: 'global' });
    const p = getSkillEntry('vue', { scope: 'project', cwd })!;
    const g = getSkillEntry('vue', { scope: 'global' })!;
    expect(p.hosts).toEqual(['zcode']);
    expect(g.hosts).toEqual(['claude']);
  });

  it('project 级记录带 scope 与 projectPath 字段', () => {
    recordSkillInstall('vue', ['zcode'], { scope: 'project', cwd });
    const entry = getSkillEntry('vue', { scope: 'project', cwd })!;
    expect(entry.scope).toBe('project');
    expect(entry.projectPath).toBe(cwd);
  });

  it('removeSkillRecord 仅删 project 级记录', () => {
    recordSkillInstall('vue', ['zcode'], { scope: 'project', cwd });
    recordSkillInstall('vue', ['claude'], { scope: 'global' });
    removeSkillRecord('vue', { scope: 'project', cwd });
    expect(getSkillEntry('vue', { scope: 'project', cwd })).toBeUndefined();
    expect(getSkillEntry('vue', { scope: 'global' })).toBeDefined();
  });
});
