import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { home } from '../../src/utils/platform.js';
import { getConnectedHosts, isProjectInitialized } from '../../src/codegraph/detector.js';

useTmpHome();

describe('codegraph detector', () => {
  it('getConnectedHosts 返回已配置 codegraph 的宿主', async () => {
    // 给 zcode 写入 codegraph 条目（zcode 用 mcp.servers 嵌套 key）
    const cfgDir = join(home(), '.zcode', 'cli');
    mkdirSync(cfgDir, { recursive: true });
    writeFileSync(join(cfgDir, 'config.json'), JSON.stringify({
      mcp: { servers: { codegraph: { command: 'codegraph', args: ['serve', '--mcp'] } } },
    }));
    const connected = await getConnectedHosts();
    expect(connected).toContain('zcode');
  });

  it('getConnectedHosts 无配置返回空', async () => {
    const connected = await getConnectedHosts();
    expect(connected).toEqual([]);
  });

  it('isProjectInitialized 无 .codegraph 返回 false', () => {
    expect(isProjectInitialized()).toBe(false);
  });

  it('isProjectInitialized 有 codegraph.db 返回 true', () => {
    const cwd = join(home(), 'proj');
    mkdirSync(join(cwd, '.codegraph'), { recursive: true });
    writeFileSync(join(cwd, '.codegraph', 'codegraph.db'), 'x');
    expect(isProjectInitialized(cwd)).toBe(true);
  });
});
