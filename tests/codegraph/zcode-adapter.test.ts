import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { home } from '../../src/utils/platform.js';
import { readFileText } from '../../src/utils/fs.js';
import { connectZCodeCodegraph, disconnectZCodeCodegraph } from '../../src/codegraph/zcode-adapter.js';

useTmpHome();

describe('zcode-adapter', () => {
  it('connect 写入 mcp.servers.codegraph', async () => {
    await connectZCodeCodegraph();
    const obj = JSON.parse(readFileText(join(home(), '.zcode', 'cli', 'config.json')));
    expect(obj.mcp.servers.codegraph).toEqual({ command: 'codegraph', args: ['serve', '--mcp'] });
  });

  it('connect 保留已有 plugins 与其他 server', async () => {
    const cfgDir = join(home(), '.zcode', 'cli');
    mkdirSync(cfgDir, { recursive: true });
    writeFileSync(join(cfgDir, 'config.json'), JSON.stringify({
      plugins: { enabledPlugins: { 'x@y': true } },
      mcp: { servers: { 'zai-mcp': { command: 'npx' } } },
    }));
    await connectZCodeCodegraph();
    const obj = JSON.parse(readFileText(join(cfgDir, 'config.json')));
    expect(obj.plugins.enabledPlugins['x@y']).toBe(true);
    expect(obj.mcp.servers['zai-mcp']).toBeDefined();
    expect(obj.mcp.servers.codegraph).toBeDefined();
  });

  it('disconnect 移除 codegraph 保留其他', async () => {
    const cfgDir = join(home(), '.zcode', 'cli');
    mkdirSync(cfgDir, { recursive: true });
    writeFileSync(join(cfgDir, 'config.json'), JSON.stringify({
      mcp: { servers: { codegraph: { command: 'codegraph' }, 'zai-mcp': { command: 'npx' } } },
    }));
    await disconnectZCodeCodegraph();
    const obj = JSON.parse(readFileText(join(cfgDir, 'config.json')));
    expect(obj.mcp.servers.codegraph).toBeUndefined();
    expect(obj.mcp.servers['zai-mcp']).toBeDefined();
  });

  it('connect 幂等：重复写入不重复不报错', async () => {
    await connectZCodeCodegraph();
    await connectZCodeCodegraph();
    const obj = JSON.parse(readFileText(join(home(), '.zcode', 'cli', 'config.json')));
    expect(Object.keys(obj.mcp.servers)).toEqual(['codegraph']);
  });
});
