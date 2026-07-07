import { describe, it, expect } from 'vitest';
import { useTmpHome } from '../helpers/tmp-home.js';
import { pathExists } from '../../src/utils/fs.js';
import {
  loadManifest, saveManifest, recordSkillInstall, recordCodegraphConnect,
  recordCodegraphCli, removeSkillRecord, getSkillEntry, emptyManifest, manifestPath,
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
