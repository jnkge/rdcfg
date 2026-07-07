import { describe, it, expect, vi } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { home } from '../../src/utils/platform.js';
import { readFileText, pathExists } from '../../src/utils/fs.js';

useTmpHome();

// mock exec，避免真实调用 npm/codegraph
vi.mock('../../src/utils/exec.js', () => ({
  commandExists: vi.fn().mockResolvedValue(true),
  run: vi.fn().mockResolvedValue(''),
  tryRun: vi.fn().mockResolvedValue({ success: true, stdout: '', stderr: '' }),
}));

import { connectHosts, uninstallCodegraph } from '../../src/codegraph/installer.js';

describe('codegraph installer（mock exec）', () => {
  it('connectHosts 给 zcode 写入 MCP 配置', async () => {
    const results = await connectHosts(['zcode']);
    const zcodeResult = results.find(r => r.hostId === 'zcode');
    expect(zcodeResult?.ok).toBe(true);
    // 验证 ZCode 配置已写入
    const cfgPath = join(home(), '.zcode', 'cli', 'config.json');
    const obj = JSON.parse(readFileText(cfgPath));
    expect(obj.mcp.servers.codegraph).toEqual({ command: 'codegraph', args: ['serve', '--mcp'] });
  });

  it('connectHosts 原生宿主调 codegraph install', async () => {
    const results = await connectHosts(['claude', 'cursor']);
    expect(results.every(r => r.ok)).toBe(true);
  });

  it('uninstallCodegraph 移除 ZCode 条目', async () => {
    // 先写入
    const cfgDir = join(home(), '.zcode', 'cli');
    mkdirSync(cfgDir, { recursive: true });
    writeFileSync(join(cfgDir, 'config.json'), JSON.stringify({
      mcp: { servers: { codegraph: { command: 'codegraph' }, keep: { command: 'x' } } },
    }));
    await uninstallCodegraph(['zcode']);
    const obj = JSON.parse(readFileText(join(cfgDir, 'config.json')));
    expect(obj.mcp.servers.codegraph).toBeUndefined();
    expect(obj.mcp.servers.keep).toBeDefined();
  });
});
