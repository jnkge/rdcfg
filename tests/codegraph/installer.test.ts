import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useTmpHome } from '../helpers/tmp-home.js';
import { home, appData } from '../../src/utils/platform.js';
import { readFileText, pathExists } from '../../src/utils/fs.js';

useTmpHome();

// mock exec，避免真实调用 npm/codegraph
vi.mock('../../src/utils/exec.js', () => ({
  commandExists: vi.fn().mockResolvedValue(true),
  run: vi.fn().mockResolvedValue(''),
  tryRun: vi.fn().mockResolvedValue({ success: true, stdout: '', stderr: '', exitCode: 0 }),
}));

import { connectHosts, uninstallCodegraph, installCli, initProject } from '../../src/codegraph/installer.js';
import * as exec from '../../src/utils/exec.js';

const runMock = exec.run as ReturnType<typeof vi.fn>;
const tryRunMock = exec.tryRun as ReturnType<typeof vi.fn>;

describe('codegraph installer（mock exec）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认走 CLI 已安装（installCli 直接跳过）
    (exec.commandExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('connectHosts 给 zcode 写入 MCP 配置', async () => {
    const results = await connectHosts(['zcode']);
    const zcodeResult = results.find(r => r.hostId === 'zcode');
    expect(zcodeResult?.ok).toBe(true);
    // 验证 ZCode 配置已写入
    const cfgPath = join(home(), '.zcode', 'cli', 'config.json');
    const obj = JSON.parse(readFileText(cfgPath));
    expect(obj.mcp.servers.codegraph).toEqual({ command: 'codegraph', args: ['serve', '--mcp'] });
  });

  it('connectHosts 原生宿主调 codegraph install（非交互 -y --target）', async () => {
    const results = await connectHosts(['claude', 'cursor']);
    expect(results.every(r => r.ok)).toBe(true);
    // 验证传了非交互参数：install -y --target claude,cursor
    expect(tryRunMock).toHaveBeenCalledWith('codegraph', ['install', '-y', '--target', 'claude,cursor']);
  });

  it('connectHosts 含 trae 时通过 adapter 写入 MCP 配置', async () => {
    const results = await connectHosts(['trae']);
    const traeResult = results.find(r => r.hostId === 'trae');
    expect(traeResult?.ok).toBe(true);
    // 验证 Trae 配置已写入（写第一个变体 Trae CN）
    const cfgPath = join(appData(), 'Trae CN', 'User', 'mcp.json');
    const obj = JSON.parse(readFileText(cfgPath));
    expect(obj.mcpServers.codegraph).toEqual({ command: 'codegraph', args: ['serve', '--mcp'] });
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

describe('installCli 错误诊断', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // CLI 未安装，进入 npm 安装分支
    (exec.commandExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  });

  it('EACCES 权限错误给出 sudo / prefix 建议', async () => {
    const err = Object.assign(new Error('Command failed'), {
      stdout: 'npm warn something',
      stderr: 'npm ERR! code EACCES\nnpm ERR! permission denied /usr/local/lib',
      exitCode: 1,
    });
    runMock.mockRejectedValueOnce(err);

    const r = await installCli();
    expect(r.ok).toBe(false);
    expect(r.message).toContain('退出码 1');
    expect(r.message).toContain('EACCES');
    expect(r.message).toContain('permission denied');
    expect(r.message).toContain('权限不足');
    expect(r.message).toContain('sudo');
  });

  it('ETIMEDOUT 网络错误给出 registry 建议', async () => {
    const err = Object.assign(new Error('Command failed'), {
      stdout: '',
      stderr: 'npm ERR! network ETIMEDOUT',
      exitCode: 1,
    });
    runMock.mockRejectedValueOnce(err);

    const r = await installCli();
    expect(r.ok).toBe(false);
    expect(r.message).toContain('ETIMEDOUT');
    expect(r.message).toContain('网络异常');
    expect(r.message).toContain('registry.npmmirror.com');
  });

  it('404 包不存在给出确认包名建议', async () => {
    const err = Object.assign(new Error('Command failed'), {
      stdout: '',
      stderr: 'npm ERR! 404 Not Found - @colbymchenry/codegraph',
      exitCode: 1,
    });
    runMock.mockRejectedValueOnce(err);

    const r = await installCli();
    expect(r.ok).toBe(false);
    expect(r.message).toContain('404');
    expect(r.message).toContain('未在 registry 找到包');
  });

  it('未知错误也透传完整输出（不丢 stdout/stderr）', async () => {
    const err = Object.assign(new Error('Command failed'), {
      stdout: 'some stdout detail',
      stderr: 'weird error',
      exitCode: 42,
    });
    runMock.mockRejectedValueOnce(err);

    const r = await installCli();
    expect(r.ok).toBe(false);
    expect(r.message).toContain('退出码 42');
    expect(r.message).toContain('some stdout detail');
    expect(r.message).toContain('weird error');
    // 未知错误不应误触发诊断建议
    expect(r.message).not.toContain('--- 建议 ---');
    // 仍保留手动重试提示
    expect(r.message).toContain('npm i -g');
  });
});

describe('connectHosts / initProject 失败透传', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (exec.commandExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('原生宿主 codegraph install 失败时透传 stdout/stderr/exitCode', async () => {
    tryRunMock.mockResolvedValueOnce({
      success: false,
      stdout: 'partial progress',
      stderr: 'config write denied',
      exitCode: 2,
    });

    const results = await connectHosts(['claude', 'cursor']);
    const failed = results.filter(r => !r.ok);
    expect(failed.length).toBe(2);
    for (const r of failed) {
      expect(r.message).toContain('退出码 2');
      expect(r.message).toContain('partial progress');
      expect(r.message).toContain('config write denied');
    }
  });

  it('initProject 失败透传完整输出', async () => {
    tryRunMock.mockResolvedValueOnce({
      success: false,
      stdout: '',
      stderr: 'no permission to write .codegraph',
      exitCode: 1,
    });

    const r = await initProject('/tmp/some-cwd');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('退出码 1');
    expect(r.message).toContain('no permission to write .codegraph');
  });
});
