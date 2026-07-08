import { traeHost } from '../hosts/trae.js';
import type { McpServerConfig } from '../types.js';

const SERVER_NAME = 'codegraph';
export const CODEGRAPH_CFG: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

/**
 * 把 codegraph MCP server 写入 Trae 的 mcp.json。
 * 幂等：已存在则覆盖（保证最新配置）。
 */
export async function connectTraeCodegraph(): Promise<void> {
  await traeHost.writeMcpServer(SERVER_NAME, CODEGRAPH_CFG);
}

/**
 * 从 Trae 配置移除 codegraph 条目（保留其他 MCP 配置）。
 */
export async function disconnectTraeCodegraph(): Promise<void> {
  await traeHost.removeMcpServer(SERVER_NAME);
}
