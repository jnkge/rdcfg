import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { atomicWriteFile, readFileText } from '../../src/utils/fs.js';
import { home } from '../../src/utils/platform.js';
import { cursorHost } from '../../src/hosts/cursor.js';
import type { McpServerConfig } from '../../src/types.js';

useTmpHome();

const cfg: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

describe('cursorHost', () => {
  it('写入 mcp.json 的 mcpServers', async () => {
    await cursorHost.writeMcpServer('codegraph', cfg);
    const obj = JSON.parse(readFileText(join(home(), '.cursor', 'mcp.json')));
    expect(obj.mcpServers.codegraph).toEqual(cfg);
  });

  it('保留已有条目', async () => {
    const p = join(home(), '.cursor', 'mcp.json');
    mkdirSync(join(home(), '.cursor'), { recursive: true });
    atomicWriteFile(p, JSON.stringify({ mcpServers: { 'browser-tools': { command: 'npx' } } }));
    await cursorHost.writeMcpServer('codegraph', cfg);
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcpServers['browser-tools']).toBeDefined();
    expect(obj.mcpServers.codegraph).toEqual(cfg);
  });

  it('removeMcpServer 删除指定条目', async () => {
    const p = join(home(), '.cursor', 'mcp.json');
    mkdirSync(join(home(), '.cursor'), { recursive: true });
    atomicWriteFile(p, JSON.stringify({ mcpServers: { codegraph: cfg, keep: { command: 'k' } } }));
    await cursorHost.removeMcpServer('codegraph');
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcpServers.codegraph).toBeUndefined();
    expect(obj.mcpServers.keep).toBeDefined();
  });
});
