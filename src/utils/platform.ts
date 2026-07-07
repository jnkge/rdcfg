import { homedir } from 'node:os';
import { join } from 'node:path';

export function home(): string {
  return process.env.HOME || process.env.USERPROFILE || homedir();
}

export function appData(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA || join(home(), 'AppData', 'Roaming');
  }
  // mac/linux 无 APPDATA 概念，回退到 ~/.config
  return process.env.XDG_CONFIG_HOME || join(home(), '.config');
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}
