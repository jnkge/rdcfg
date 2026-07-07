/** 内置 skill 元数据（从 skills/<name>/SKILL.md frontmatter 读出） */
export interface Skill {
  name: string;
  description: string;
  category: string;
  source: string;
  dir: string;
}

/** MCP server 配置（写入各宿主） */
export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  type?: 'stdio' | 'http';
  url?: string;
  headers?: Record<string, string>;
}

/** 宿主 ID 联合类型 */
export type HostId = 'claude' | 'codex' | 'cursor' | 'zcode' | 'trae';

/** 宿主抽象接口 —— skills 与 codegraph 共用 */
export interface Host {
  readonly id: HostId;
  readonly displayName: string;
  readonly skillsDir: string;
  /** MCP 配置文件候选路径（Trae 返回多个变体；其他返回单元素） */
  mcpConfigPaths(): string[];
  readonly mcpConfigFormat: 'json' | 'toml';
  /** MCP servers 在配置里的嵌套 key 路径 */
  readonly mcpConfigKey: string[];
  /** 宿主是否安装在本机（关键目录存在） */
  isAvailable(): boolean;
  readMcpConfig(): Promise<Record<string, unknown>>;
  writeMcpServer(name: string, cfg: McpServerConfig): Promise<void>;
  removeMcpServer(name: string): Promise<void>;
}

/** rdcfg 清单条目：单个 skill 装到了哪些宿主 */
export interface ManifestSkillEntry {
  name: string;
  hosts: HostId[];
  installedAt: string;
}

/** rdcfg 清单条目：codegraph 连接状态 */
export interface ManifestCodegraphEntry {
  cliInstalled: boolean;
  connectedHosts: HostId[];
}

/** rdcfg 自维护清单，存在 ~/.rdcfg/manifest.json */
export interface Manifest {
  version: 1;
  installedAt: string;
  skills: ManifestSkillEntry[];
  codegraph: ManifestCodegraphEntry;
}

/** codegraph 三层检测状态 */
export interface CodegraphStatus {
  cliInstalled: boolean;
  cliVersion: string | null;
  connectedHosts: HostId[];
  projectInitialized: boolean;
}
