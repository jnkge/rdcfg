import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { atomicWriteFile, readFileText } from '../../src/utils/fs.js';
import { home } from '../../src/utils/platform.js';
import { codexHost } from '../../src/hosts/codex.js';
import * as TOML from '@iarna/toml';
import type { McpServerConfig } from '../../src/types.js';

useTmpHome();

const cfg: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

describe('codexHost', () => {
  it('TOML 写入并解析回来结构正确', async () => {
    await codexHost.writeMcpServer('codegraph', cfg);
    const doc: any = TOML.parse(readFileText(join(home(), '.codex', 'config.toml')));
    expect(doc.mcp_servers.codegraph.command).toBe('codegraph');
    expect(doc.mcp_servers.codegraph.args).toEqual(['serve', '--mcp']);
  });

  it('保留已有 TOML 字段（model 等）', async () => {
    const p = join(home(), '.codex', 'config.toml');
    mkdirSync(join(home(), '.codex'), { recursive: true });
    atomicWriteFile(p, 'model = "gpt-4"\n');
    await codexHost.writeMcpServer('codegraph', cfg);
    const doc: any = TOML.parse(readFileText(p));
    expect(doc.model).toBe('gpt-4');
    expect(doc.mcp_servers.codegraph.command).toBe('codegraph');
  });

  it('removeMcpServer 删除指定 TOML 条目', async () => {
    const p = join(home(), '.codex', 'config.toml');
    mkdirSync(join(home(), '.codex'), { recursive: true });
    atomicWriteFile(p, TOML.stringify({
      mcp_servers: { codegraph: { command: 'codegraph' }, keep: { command: 'k' } },
    } as any));
    await codexHost.removeMcpServer('codegraph');
    const doc: any = TOML.parse(readFileText(p));
    expect(doc.mcp_servers.codegraph).toBeUndefined();
    expect(doc.mcp_servers.keep).toBeDefined();
  });
});
