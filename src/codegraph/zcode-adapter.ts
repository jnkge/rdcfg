import { zcodeHost } from '../hosts/zcode.js';
import type { McpServerConfig } from '../types.js';

const SERVER_NAME = 'codegraph';
export const CODEGRAPH_CFG: McpServerConfig = { command: 'codegraph', args: ['serve', '--mcp'] };

/**
 * 把 codegraph MCP server 写入 ZCode 的 config.json。
 * 幂等：已存在则覆盖（保证最新配置）。
 */
export async function connectZCodeCodegraph(): Promise<void> {
  await zcodeHost.writeMcpServer(SERVER_NAME, CODEGRAPH_CFG);
}

/**
 * 从 ZCode 配置移除 codegraph 条目（保留其他 MCP 配置）。
 */
export async function disconnectZCodeCodegraph(): Promise<void> {
  await zcodeHost.removeMcpServer(SERVER_NAME);
}
