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
 * 执行命令，返回 stdout（trim）。失败抛错（携带 stdout/stderr/exitCode）。
 *
 * execa 9.x 抛出的 error.message 只是 "Command failed with exit code N"，
 * 真正的失败原因（npm EACCES、ETIMEDOUT、registry 404）都在 stdout/stderr 里。
 * 这里把完整输出拼到 error 上，供上层拼装详细诊断。
 */
export async function run(cmd: string, args: string[], opts: RunOptions = {}): Promise<string> {
  try {
    const result = await execa(cmd, args, {
      cwd: opts.cwd,
      timeout: opts.timeout ?? 60000,
      env: { ...process.env, ...opts.env },
      reject: true,
    });
    return (result.stdout || '').trim();
  } catch (e: any) {
    const stdout = (e?.stdout || '').trim();
    const stderr = (e?.stderr || '').trim();
    const exitCode = e?.exitCode;
    const detail = [stdout, stderr].filter(Boolean).join('\n');
    const enriched = new Error(
      [
        `命令失败: ${cmd} ${args.join(' ')}${exitCode !== undefined ? `（退出码 ${exitCode}）` : ''}`,
        detail ? `--- 输出 ---\n${detail}` : null,
      ].filter(Boolean).join('\n')
    );
    (enriched as any).stdout = stdout;
    (enriched as any).stderr = stderr;
    (enriched as any).exitCode = exitCode;
    throw enriched;
  }
}

export interface TryRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * 执行命令，失败不抛错，返回 { success, stdout, stderr, exitCode }。
 */
export async function tryRun(
  cmd: string, args: string[], opts: RunOptions = {}
): Promise<TryRunResult> {
  try {
    const result = await execa(cmd, args, {
      cwd: opts.cwd,
      timeout: opts.timeout ?? 60000,
      env: { ...process.env, ...opts.env },
      reject: false,
    });
    return {
      success: result.exitCode === 0,
      stdout: (result.stdout || '').trim(),
      stderr: (result.stderr || '').trim(),
      exitCode: result.exitCode ?? null,
    };
  } catch (e: any) {
    return {
      success: false,
      stdout: (e?.stdout || '').trim(),
      stderr: (e?.stderr || e?.message || String(e)).trim(),
      exitCode: e?.exitCode ?? null,
    };
  }
}

/** node_modules/.bin 是否存在某 bin（用于本包内 codegraph 模拟） */
export function localBinExists(name: string): boolean {
  return existsSync(name);
}
