import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { atomicWriteFile, readFileText, pathExists } from '../../src/utils/fs.js';
import { appData, home } from '../../src/utils/platform.js';
import { traeHost } from '../../src/hosts/trae.js';
import type { McpServerConfig } from '../../src/types.js';

useTmpHome();

const cfg: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

describe('traeHost', () => {
  it('双变体目录都存在时都写入', async () => {
    mkdirSync(join(appData(), 'Trae CN', 'User'), { recursive: true });
    mkdirSync(join(appData(), 'TRAE SOLO CN', 'User'), { recursive: true });
    await traeHost.writeMcpServer('codegraph', cfg);
    const a = JSON.parse(readFileText(join(appData(), 'Trae CN', 'User', 'mcp.json')));
    const b = JSON.parse(readFileText(join(appData(), 'TRAE SOLO CN', 'User', 'mcp.json')));
    expect(a.mcpServers.codegraph).toEqual(cfg);
    expect(b.mcpServers.codegraph).toEqual(cfg);
  });

  it('无变体存在时写入默认 Trae CN', async () => {
    await traeHost.writeMcpServer('codegraph', cfg);
    expect(pathExists(join(appData(), 'Trae CN', 'User', 'mcp.json'))).toBe(true);
  });

  it('保留已有 rdc-frontend-mcp 条目', async () => {
    const p = join(appData(), 'Trae CN', 'User', 'mcp.json');
    mkdirSync(join(appData(), 'Trae CN', 'User'), { recursive: true });
    atomicWriteFile(p, JSON.stringify({ mcpServers: { 'rdc-frontend-mcp': { url: 'http://x' } } }));
    await traeHost.writeMcpServer('codegraph', cfg);
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcpServers['rdc-frontend-mcp']).toBeDefined();
    expect(obj.mcpServers.codegraph).toEqual(cfg);
  });

  it('isAvailable 检测变体目录', () => {
    expect(traeHost.isAvailable()).toBe(false);
    mkdirSync(join(appData(), 'Trae CN'), { recursive: true });
    expect(traeHost.isAvailable()).toBe(true);
  });

  it('removeMcpServer 双变体都清理', async () => {
    mkdirSync(join(appData(), 'Trae CN', 'User'), { recursive: true });
    mkdirSync(join(appData(), 'TRAE SOLO CN', 'User'), { recursive: true });
    await traeHost.writeMcpServer('codegraph', cfg);
    await traeHost.removeMcpServer('codegraph');
    const a = JSON.parse(readFileText(join(appData(), 'Trae CN', 'User', 'mcp.json')));
    const b = JSON.parse(readFileText(join(appData(), 'TRAE SOLO CN', 'User', 'mcp.json')));
    expect(a.mcpServers.codegraph).toBeUndefined();
    expect(b.mcpServers.codegraph).toBeUndefined();
  });

  it('projectSkillsDir 指向 <cwd>/.trae/skills', () => {
    expect(traeHost.projectSkillsDir!('/proj')).toBe(join('/proj', '.trae', 'skills'));
  });
});
