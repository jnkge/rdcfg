import { join } from 'node:path';
import { appData, home } from '../utils/platform.js';
import { pathExists, readFileText, atomicWriteFile } from '../utils/fs.js';
import JSON5 from 'json5';
import type { Host, McpServerConfig } from '../types.js';

const VARIANT_DIRS = ['Trae CN', 'TRAE SOLO CN'];
const mcpPath = (variant: string) => join(appData(), variant, 'User', 'mcp.json');
const SKILLS_DIR = () => join(home(), '.trae', 'skills');
const PROJECT_SKILLS_DIR = (cwd: string) => join(cwd, '.trae', 'skills');

export const traeHost: Host = {
  id: 'trae',
  displayName: 'Trae',
  get skillsDir() { return SKILLS_DIR(); },
  projectSkillsDir: (cwd: string) => PROJECT_SKILLS_DIR(cwd),
  mcpConfigPaths: () => VARIANT_DIRS.map(mcpPath),
  mcpConfigFormat: 'json',
  mcpConfigKey: ['mcpServers'],
  isAvailable: () => VARIANT_DIRS.some(v => pathExists(join(appData(), v)))
                || pathExists(join(home(), '.trae')),
  async readMcpConfig() {
    // 读第一个存在的变体
    for (const v of VARIANT_DIRS) {
      const p = mcpPath(v);
      if (pathExists(p)) return JSON5.parse(readFileText(p));
    }
    return {};
  },
  async writeMcpServer(name: string, cfg: McpServerConfig) {
    // 所有存在的变体都写入；都不存在则写第一个（Trae CN）作为默认
    const targets = VARIANT_DIRS.filter(v => pathExists(join(appData(), v)));
    const writeToList = targets.length > 0 ? targets : ['Trae CN'];
    for (const v of writeToList) {
      const p = mcpPath(v);
      const obj = pathExists(p) ? JSON5.parse(readFileText(p)) : {};
      obj.mcpServers = obj.mcpServers || {};
      obj.mcpServers[name] = cfg;
      atomicWriteFile(p, JSON.stringify(obj, null, 2));
    }
  },
  async removeMcpServer(name: string) {
    for (const v of VARIANT_DIRS) {
      const p = mcpPath(v);
      if (!pathExists(p)) continue;
      const obj = JSON5.parse(readFileText(p));
      if (obj.mcpServers && name in obj.mcpServers) {
        delete obj.mcpServers[name];
        atomicWriteFile(p, JSON.stringify(obj, null, 2));
      }
    }
  },
};
