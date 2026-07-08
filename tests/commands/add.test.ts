import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTmpHome } from '../helpers/tmp-home.js';

useTmpHome();

// mock clack prompts，避免真实交互
vi.mock('@clack/prompts', async () => {
  const actual: any = await vi.importActual('@clack/prompts');
  return {
    ...actual,
    select: vi.fn(async () => 'global'),
    multiselect: vi.fn(async () => []),
    confirm: vi.fn(async () => false),
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    isCancel: (v: any) => v === undefined || v === null || (typeof v === 'symbol' && v.toString() === 'Symbol(clack-cancel)'),
    log: { warn: vi.fn(), info: vi.fn(), ok: vi.fn(), fail: vi.fn(), step: vi.fn() },
  };
});

import { runAdd } from '../../src/commands/add.js';

describe('runAdd language flag', () => {
  it('非法 language 抛错', async () => {
    await expect(runAdd(['vue-best-practices'], { language: 'rust', hosts: ['zcode'] })).rejects.toThrow(/不支持的语言/);
  });

  it('-l go + 指定 skill 不属于 go 时抛错', async () => {
    await expect(runAdd(['vue-best-practices'], { language: 'go', hosts: ['zcode'] })).rejects.toThrow(/不属于 go/);
  });

  it('-l go + 合法 go skill 正常安装', async () => {
    await expect(runAdd(['go-project-layout'], { language: 'go', hosts: ['zcode'] })).resolves.toBeUndefined();
  });

  it('无 language + 指定 skill 不过滤（向后兼容）', async () => {
    await expect(runAdd(['vue-best-practices'], { hosts: ['zcode'] })).resolves.toBeUndefined();
  });
});
