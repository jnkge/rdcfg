import { join } from 'node:path';
import { home } from '../utils/platform.js';
import { pathExists, readFileText, atomicWriteFile } from '../utils/fs.js';
import JSON5 from 'json5';
import type { Host, McpServerConfig } from '../types.js';

const CONFIG_PATH = () => join(home(), '.cursor', 'mcp.json');
const SKILLS_DIR = () => join(home(), '.cursor', 'skills');

export const cursorHost: Host = {
  id: 'cursor',
  displayName: 'Cursor',
  get skillsDir() { return SKILLS_DIR(); },
  mcpConfigPaths: () => [CONFIG_PATH()],
  mcpConfigFormat: 'json',
  mcpConfigKey: ['mcpServers'],
  isAvailable: () => pathExists(join(home(), '.cursor')),
  async readMcpConfig() {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return {};
    return JSON5.parse(readFileText(p));
  },
  async writeMcpServer(name: string, cfg: McpServerConfig) {
    const p = CONFIG_PATH();
    const obj = pathExists(p) ? JSON5.parse(readFileText(p)) : {};
    obj.mcpServers = obj.mcpServers || {};
    obj.mcpServers[name] = cfg;
    atomicWriteFile(p, JSON.stringify(obj, null, 2));
  },
  async removeMcpServer(name: string) {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return;
    const obj = JSON5.parse(readFileText(p));
    if (obj.mcpServers && name in obj.mcpServers) {
      delete obj.mcpServers[name];
      atomicWriteFile(p, JSON.stringify(obj, null, 2));
    }
  },
};
