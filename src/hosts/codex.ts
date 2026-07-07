import { join } from 'node:path';
import { home } from '../utils/platform.js';
import { pathExists, readFileText, atomicWriteFile } from '../utils/fs.js';
import * as TOML from '@iarna/toml';
import type { Host, McpServerConfig } from '../types.js';

const CONFIG_PATH = () => join(home(), '.codex', 'config.toml');
const SKILLS_DIR = () => join(home(), '.codex', 'skills');
const PROJECT_SKILLS_DIR = (cwd: string) => join(cwd, '.codex', 'skills');

/** 把 McpServerConfig 转成 TOML 友好的普通对象（去 undefined） */
function toPlain(cfg: McpServerConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (cfg.command) out.command = cfg.command;
  if (cfg.args) out.args = cfg.args;
  if (cfg.env) out.env = cfg.env;
  if (cfg.url) out.url = cfg.url;
  if (cfg.type) out.type = cfg.type;
  if (cfg.headers) out.headers = cfg.headers;
  return out;
}

export const codexHost: Host = {
  id: 'codex',
  displayName: 'Codex CLI',
  get skillsDir() { return SKILLS_DIR(); },
  projectSkillsDir: (cwd: string) => PROJECT_SKILLS_DIR(cwd),
  mcpConfigPaths: () => [CONFIG_PATH()],
  mcpConfigFormat: 'toml',
  mcpConfigKey: ['mcp_servers'],
  isAvailable: () => pathExists(join(home(), '.codex')),
  async readMcpConfig() {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return {};
    return TOML.parse(readFileText(p)) as unknown as Record<string, unknown>;
  },
  async writeMcpServer(name: string, cfg: McpServerConfig) {
    const p = CONFIG_PATH();
    let doc: any;
    if (pathExists(p)) {
      doc = TOML.parse(readFileText(p));
    } else {
      doc = {};
    }
    doc.mcp_servers = doc.mcp_servers || {};
    doc.mcp_servers[name] = toPlain(cfg);
    atomicWriteFile(p, TOML.stringify(doc));
  },
  async removeMcpServer(name: string) {
    const p = CONFIG_PATH();
    if (!pathExists(p)) return;
    const doc: any = TOML.parse(readFileText(p));
    if (doc.mcp_servers && name in doc.mcp_servers) {
      delete doc.mcp_servers[name];
      atomicWriteFile(p, TOML.stringify(doc));
    }
  },
};
