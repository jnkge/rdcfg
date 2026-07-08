import { describe, it, expect, vi } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { useTmpHome } from '../helpers/tmp-home.js';
import { home } from '../../src/utils/platform.js';

useTmpHome();

// mock exec：模拟 codegraph 命令存在 + install 成功
vi.mock('../../src/utils/exec.js', async () => {
  const actual: any = await vi.importActual('../../src/utils/exec.js');
  // 真实 codegraph install 会在原生宿主配置里写入 codegraph MCP 条目。
  // 这里模拟其副作用，使 E2E 能验证端到端写入。
  function applyNativeInstall() {
    const CODEGRAPH_MCP = { command: 'codegraph', args: ['serve', '--mcp'] };
    // claude: ~/.claude.json 的 mcpServers
    try {
      const claudePath = join(home(), '.claude.json');
      const claudeObj = existsSync(claudePath) ? JSON.parse(readFileSync(claudePath, 'utf8')) : {};
      claudeObj.mcpServers = claudeObj.mcpServers || {};
      claudeObj.mcpServers.codegraph = CODEGRAPH_MCP;
      writeFileSync(claudePath, JSON.stringify(claudeObj, null, 2));
    } catch { /* 忽略 */ }
  }
  return {
    ...actual,
    commandExists: vi.fn(async (cmd: string) => cmd === 'codegraph' || cmd === 'npm'),
    tryRun: vi.fn(async (cmd: string, args: string[]) => {
      // 模拟 codegraph init 创建 .codegraph/codegraph.db
      if (cmd === 'codegraph' && args?.[0] === 'init') {
        const cwd = process.cwd();
        mkdirSync(join(cwd, '.codegraph'), { recursive: true });
        writeFileSync(join(cwd, '.codegraph', 'codegraph.db'), '');
        return { success: true, stdout: '', stderr: '' };
      }
      // 模拟 codegraph install 在原生宿主写入 MCP 配置
      if (cmd === 'codegraph' && args?.[0] === 'install') {
        applyNativeInstall();
        return { success: true, stdout: '', stderr: '' };
      }
      return { success: true, stdout: '', stderr: '' };
    }),
  };
});

import { listSkills } from '../../src/skills/registry.js';
import { installSkill } from '../../src/skills/installer.js';
import { connectHosts, initProject } from '../../src/codegraph/installer.js';
import { detectCodegraph } from '../../src/codegraph/detector.js';

describe('E2E: skills + codegraph 全流程（mock codegraph）', () => {
  it('listSkills 能读到内置 skills', () => {
    const skills = listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(3);
    expect(skills.map(s => s.name)).toContain('vue-best-practices');
  });

  it('listSkills 含 16 个 skill，覆盖 5 种语言', () => {
    const skills = listSkills();
    expect(skills).toHaveLength(16);
    const langs = new Set(skills.map(s => s.language));
    expect(langs).toEqual(new Set(['frontend', 'python', 'go', 'php', 'flutter']));
  });

  it('每个新语言至少有 3 个 skill', () => {
    const skills = listSkills();
    expect(skills.filter(s => s.language === 'python').length).toBeGreaterThanOrEqual(3);
    expect(skills.filter(s => s.language === 'go').length).toBeGreaterThanOrEqual(3);
    expect(skills.filter(s => s.language === 'php').length).toBeGreaterThanOrEqual(3);
    expect(skills.filter(s => s.language === 'flutter').length).toBeGreaterThanOrEqual(3);
  });

  it('装 skill 到 zcode + claude，再读配置验证', () => {
    const results = installSkill('vue-best-practices', ['zcode', 'claude']);
    expect(results.every(r => r.outcome === 'installed')).toBe(true);
    expect(existsSync(join(home(), '.zcode', 'skills', 'vue-best-practices', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(home(), '.claude', 'skills', 'vue-best-practices', 'SKILL.md'))).toBe(true);
  });

  it('project scope 装入当前项目目录而非家目录', () => {
    const projectCwd = mkdtempSync(join(tmpdir(), 'rdcfg-e2e-proj-'));
    const results = installSkill('vue-best-practices', ['zcode'], { scope: 'project', cwd: projectCwd });
    expect(results.every(r => r.outcome === 'installed')).toBe(true);
    expect(existsSync(join(projectCwd, '.zcode', 'skills', 'vue-best-practices', 'SKILL.md'))).toBe(true);
    // 全局目录不应有
    expect(existsSync(join(home(), '.zcode', 'skills', 'vue-best-practices'))).toBe(false);
  });

  it('新语言 skill（go-project-layout）project 安装正常', () => {
    const projectCwd = mkdtempSync(join(tmpdir(), 'rdcfg-e2e-go-'));
    const results = installSkill('go-project-layout', ['zcode'], { scope: 'project', cwd: projectCwd });
    expect(results.every(r => r.outcome === 'installed')).toBe(true);
    expect(existsSync(join(projectCwd, '.zcode', 'skills', 'go-project-layout', 'SKILL.md'))).toBe(true);
  });

  it('连接 codegraph 到 zcode + claude，配置已写入', async () => {
    await connectHosts(['zcode', 'claude']);
    const zc = JSON.parse(readFileSync(join(home(), '.zcode', 'cli', 'config.json'), 'utf8'));
    expect(zc.mcp.servers.codegraph).toBeDefined();
    const cc = JSON.parse(readFileSync(join(home(), '.claude.json'), 'utf8'));
    expect(cc.mcpServers.codegraph).toBeDefined();
  });

  it('detectCodegraph 反映已连接状态', async () => {
    await connectHosts(['zcode']);
    const status = await detectCodegraph();
    expect(status.cliInstalled).toBe(true);
    expect(status.connectedHosts).toContain('zcode');
  });

  it('initProject 创建 .codegraph/codegraph.db', async () => {
    const r = await initProject();
    expect(r.ok).toBe(true);
    expect(existsSync(join(process.cwd(), '.codegraph', 'codegraph.db'))).toBe(true);
  });
});
