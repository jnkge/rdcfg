import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { atomicWriteFile, readFileText } from '../../src/utils/fs.js';
import { home } from '../../src/utils/platform.js';
import { zcodeHost } from '../../src/hosts/zcode.js';
import type { McpServerConfig } from '../../src/types.js';

useTmpHome();

const cfg: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

// 用真实环境里见过的结构做基线
const REAL_LIKE = {
  plugins: { enabledPlugins: { 'superpowers@x': true } },
  mcp: { servers: { 'zai-mcp-server': { command: 'npx', args: ['-y', '@z/mcp'] } } },
};

describe('zcodeHost', () => {
  it('写入到 mcp.servers.codegraph 并保留 plugins', async () => {
    const p = join(home(), '.zcode', 'cli', 'config.json');
    mkdirSync(join(home(), '.zcode', 'cli'), { recursive: true });
    atomicWriteFile(p, JSON.stringify(REAL_LIKE));
    await zcodeHost.writeMcpServer('codegraph', cfg);
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcp.servers.codegraph).toEqual(cfg);
    expect(obj.mcp.servers['zai-mcp-server']).toBeDefined();
    expect(obj.plugins.enabledPlugins['superpowers@x']).toBe(true);
  });

  it('空配置写入只多 mcp.servers.codegraph', async () => {
    await zcodeHost.writeMcpServer('codegraph', cfg);
    const obj = JSON.parse(readFileText(join(home(), '.zcode', 'cli', 'config.json')));
    expect(obj.mcp.servers.codegraph).toEqual(cfg);
  });

  it('removeMcpServer 只删 codegraph 保留 zai-mcp', async () => {
    const p = join(home(), '.zcode', 'cli', 'config.json');
    mkdirSync(join(home(), '.zcode', 'cli'), { recursive: true });
    atomicWriteFile(p, JSON.stringify({
      mcp: { servers: { codegraph: cfg, 'zai-mcp': { command: 'npx' } } },
    }));
    await zcodeHost.removeMcpServer('codegraph');
    const obj = JSON.parse(readFileText(p));
    expect(obj.mcp.servers.codegraph).toBeUndefined();
    expect(obj.mcp.servers['zai-mcp']).toBeDefined();
  });
});
