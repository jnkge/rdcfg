import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { atomicWriteFile, readFileText, pathExists } from '../../src/utils/fs.js';
import { home } from '../../src/utils/platform.js';
import { claudeHost } from '../../src/hosts/claude.js';
import type { McpServerConfig } from '../../src/types.js';

useTmpHome();

const codegraphCfg: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

describe('claudeHost', () => {
  it('空配置写入 codegraph 后只多一个 mcpServers.codegraph', async () => {
    await claudeHost.writeMcpServer('codegraph', codegraphCfg);
    const obj = JSON.parse(readFileText(join(home(), '.claude.json')));
    expect(obj.mcpServers.codegraph).toEqual(codegraphCfg);
    expect(Object.keys(obj.mcpServers)).toEqual(['codegraph']);
  });

  it('已有其他 MCP 条目时写入不破坏原有', async () => {
    const p = join(home(), '.claude.json');
    atomicWriteFile(p, JSON.stringify({
      mcpServers: { 'zai-mcp': { command: 'npx', args: ['-y', '@z/mcp'] } },
      otherField: 'keep',
    }));
    await claudeHost.writeMcpServer('codegraph', codegraphCfg);
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcpServers.zaiMcp || obj.mcpServers['zai-mcp']).toBeDefined();
    expect(obj.mcpServers.codegraph).toEqual(codegraphCfg);
    expect(obj.otherField).toBe('keep');
  });

  it('isAvailable 无目录返回 false', () => {
    expect(claudeHost.isAvailable()).toBe(false);
  });

  it('isAvailable 有 .claude 返回 true', () => {
    mkdirSync(join(home(), '.claude'), { recursive: true });
    expect(claudeHost.isAvailable()).toBe(true);
  });

  it('removeMcpServer 只删指定条目保留其他', async () => {
    const p = join(home(), '.claude.json');
    atomicWriteFile(p, JSON.stringify({
      mcpServers: {
        codegraph: codegraphCfg,
        other: { command: 'x' },
      },
    }));
    await claudeHost.removeMcpServer('codegraph');
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcpServers.codegraph).toBeUndefined();
    expect(obj.mcpServers.other).toBeDefined();
  });

  it('removeMcpServer 无文件不报错', async () => {
    await expect(claudeHost.removeMcpServer('codegraph')).resolves.toBeUndefined();
  });

  it('projectSkillsDir 指向 <cwd>/.claude/skills', () => {
    expect(claudeHost.projectSkillsDir!('/proj')).toBe(join('/proj', '.claude', 'skills'));
  });
});
