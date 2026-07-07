import { join } from 'node:path';
import { home } from '../utils/platform.js';
import { pathExists, ensureDir, readFileText, atomicWriteFile } from '../utils/fs.js';
import JSON5 from 'json5';
import type { Host, McpServerConfig } from '../types.js';

const CONFIG_PATH = () => join(home(), '.claude.json');
const SKILLS_DIR = () => join(home(), '.claude', 'skills');

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

export const claudeHost: Host = {
  id: 'claude',
  displayName: 'Claude Code',
  get skillsDir() { return SKILLS_DIR(); },
  mcpConfigPaths: () => [CONFIG_PATH()],
  mcpConfigFormat: 'json',
  mcpConfigKey: ['mcpServers'],
  isAvailable: () => pathExists(join(home(), '.claude')) || pathExists(CONFIG_PATH()),
  async readMcpConfig() {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return {};
    return JSON5.parse(readFileText(p));
  },
  async writeMcpServer(name: string, cfg: McpServerConfig) {
    const p = CONFIG_PATH();
    const obj = pathExists(p) ? JSON5.parse(readFileText(p)) : {};
    const servers = deepGet(obj, ['mcpServers']) || {};
    servers[name] = cfg;
    deepSet(obj, ['mcpServers'], servers);
    atomicWriteFile(p, JSON.stringify(obj, null, 2));
  },
  async removeMcpServer(name: string) {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return;
    const obj = JSON5.parse(readFileText(p));
    const servers = deepGet(obj, ['mcpServers']);
    if (servers && typeof servers === 'object' && name in servers) {
      delete servers[name];
      atomicWriteFile(p, JSON.stringify(obj, null, 2));
    }
  },
};
