import { join } from 'node:path';
import { home } from '../utils/platform.js';
import { pathExists, readFileText, atomicWriteFile } from '../utils/fs.js';
import JSON5 from 'json5';
import type { Host, McpServerConfig } from '../types.js';

const CONFIG_PATH = () => join(home(), '.zcode', 'cli', 'config.json');
const SKILLS_DIR = () => join(home(), '.zcode', 'skills');
const PROJECT_SKILLS_DIR = (cwd: string) => join(cwd, '.zcode', 'skills');

function deepGet(obj: any, keys: string[]): any {
  return keys.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}
function deepSet(obj: any, keys: string[], value: any): void {
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

export const zcodeHost: Host = {
  id: 'zcode',
  displayName: 'ZCode',
  get skillsDir() { return SKILLS_DIR(); },
  projectSkillsDir: (cwd: string) => PROJECT_SKILLS_DIR(cwd),
  mcpConfigPaths: () => [CONFIG_PATH()],
  mcpConfigFormat: 'json',
  mcpConfigKey: ['mcp', 'servers'],
  isAvailable: () => pathExists(join(home(), '.zcode')),
  async readMcpConfig() {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return {};
    return JSON5.parse(readFileText(p));
  },
  async writeMcpServer(name: string, cfg: McpServerConfig) {
    const p = CONFIG_PATH();
    const obj = pathExists(p) ? JSON5.parse(readFileText(p)) : {};
    const servers = deepGet(obj, ['mcp', 'servers']) || {};
    servers[name] = cfg;
    deepSet(obj, ['mcp', 'servers'], servers);
    atomicWriteFile(p, JSON.stringify(obj, null, 2));
  },
  async removeMcpServer(name: string) {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return;
    const obj = JSON5.parse(readFileText(p));
    const servers = deepGet(obj, ['mcp', 'servers']);
    if (servers && typeof servers === 'object' && name in servers) {
      delete servers[name];
      atomicWriteFile(p, JSON.stringify(obj, null, 2));
    }
  },
};
