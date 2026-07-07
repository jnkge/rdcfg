import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach } from 'vitest';

/**
 * 每个测试用独立的 fake HOME，绝不碰真实的 ~/.zcode 等。
 * vitest beforeEach 内会重置 HOME/USERPROFILE/APPDATA/CODEGRAPH_HOME 指向临时目录。
 */
export function useTmpHome(): void {
  beforeEach(() => {
    const tmp = mkdtempSync(join(tmpdir(), 'rdcfg-test-'));
    process.env.HOME = tmp;
    process.env.USERPROFILE = tmp;
    process.env.APPDATA = join(tmp, 'AppData', 'Roaming');
    process.env.LOCALAPPDATA = join(tmp, 'AppData', 'Local');
    process.env.CODEX_HOME = join(tmp, '.codex');
    process.env.CODEGRAPH_DIR = join(tmp, '.codegraph');
  });
}
