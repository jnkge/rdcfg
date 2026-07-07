import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useTmpHome } from '../helpers/tmp-home.js';
import { home } from '../../src/utils/platform.js';
import { pathExists, readFileText } from '../../src/utils/fs.js';
import { installSkillToHost } from '../../src/skills/installer.js';
import type { Skill, Host } from '../../src/types.js';

useTmpHome();

// 构造一个内存 skill + 假 host（不依赖内置 skills 目录）
function makeSkill(work: string): { skill: Skill; host: Host } {
  const skillDir = join(work, 'my-skill-src');
  mkdirSync(join(skillDir), { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), '# My Skill v1');
  const skill: Skill = {
    name: 'my-skill', description: 'd', category: 'x', source: '', dir: skillDir,
  };
  const host: Host = {
    id: 'zcode', displayName: 'Z', skillsDir: join(home(), '.zcode', 'skills'),
    mcpConfigPaths: () => [], mcpConfigFormat: 'json', mcpConfigKey: [],
    isAvailable: () => true,
    readMcpConfig: async () => ({}),
    writeMcpServer: async () => {},
    removeMcpServer: async () => {},
  };
  return { skill, host };
}

let work: string;
beforeEach(() => { work = mkdtempSync(join(tmpdir(), 'rdcfg-inst-')); });

describe('installSkillToHost', () => {
  it('首次安装创建目录与文件', () => {
    const { skill, host } = makeSkill(work);
    const r = installSkillToHost(skill, host);
    expect(r.outcome).toBe('installed');
    expect(pathExists(join(host.skillsDir, 'my-skill', 'SKILL.md'))).toBe(true);
  });

  it('内容相同跳过', () => {
    const { skill, host } = makeSkill(work);
    installSkillToHost(skill, host);
    const r = installSkillToHost(skill, host);
    expect(r.outcome).toBe('skipped-same');
  });

  it('内容不同未 force 时跳过 modified', () => {
    const { skill, host } = makeSkill(work);
    installSkillToHost(skill, host);
    // 模拟用户修改
    writeFileSync(join(host.skillsDir, 'my-skill', 'SKILL.md'), '# modified by user');
    const r = installSkillToHost(skill, host);
    expect(r.outcome).toBe('skipped-modified');
    expect(readFileText(join(host.skillsDir, 'my-skill', 'SKILL.md'))).toBe('# modified by user');
  });

  it('force 覆盖并备份', () => {
    const { skill, host } = makeSkill(work);
    installSkillToHost(skill, host);
    writeFileSync(join(host.skillsDir, 'my-skill', 'SKILL.md'), '# user changed');
    const r = installSkillToHost(skill, host, { force: true });
    expect(r.outcome).toBe('overwritten');
    expect(r.backupPath).toBeDefined();
    expect(pathExists(r.backupPath!)).toBe(true);
    // 当前内容已更新为源
    expect(readFileText(join(host.skillsDir, 'my-skill', 'SKILL.md'))).toBe('# My Skill v1');
  });
});
