import { existsSync } from 'node:fs';
import { execa } from 'execa';

/**
 * 检测命令是否在 PATH 中可执行。
 * Windows: 用 where；Unix: 用 which。
 */
export async function commandExists(cmd: string): Promise<boolean> {
  const detector = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execa(detector, [cmd]);
    return true;
  } catch {
    return false;
  }
}

export interface RunOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

/**
 * 执行命令，返回 stdout（trim）。失败抛错。
 */
export async function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<string> {
  const result = await execa(cmd, args, {
    cwd: opts.cwd,
    timeout: opts.timeout ?? 60000,
    env: { ...process.env, ...opts.env },
    reject: true,
  });
  return (result.stdout || '').trim();
}

/**
 * 执行命令，失败不抛错，返回 { success, stdout, stderr }。
 */
export async function tryRun(
  cmd: string, args: string[], opts: RunOptions = {}
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  try {
    const result = await execa(cmd, args, {
      cwd: opts.cwd,
      timeout: opts.timeout ?? 60000,
      env: { ...process.env, ...opts.env },
      reject: false,
    });
    return { success: result.exitCode === 0, stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim() };
  } catch (e: any) {
    return { success: false, stdout: '', stderr: e?.message || String(e) };
  }
}

/** node_modules/.bin 是否存在某 bin（用于本包内 codegraph 模拟） */
export function localBinExists(name: string): boolean {
  return existsSync(name);
}
