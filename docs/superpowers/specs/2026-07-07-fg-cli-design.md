# rdcfg — 前端 skills 与 codegraph 一键安装管理 CLI 设计文档

- **日期**：2026-07-07
- **状态**：待审阅
- **作者**：brainstorming 产出
- **范围**：MVP 首版

## 1. 背景与目标

用户希望开发一个 CLI 工具，一条命令就能为各类 AI 编码助手（ZCode / Claude Code / Codex / Cursor / Trae）安装**前端 skills**（精选社区 SKILL.md 形态）和 **codegraph 代码图谱插件**（外部 stdio MCP server CLI）。

### 核心诉求

1. **一键安装**：交互式向导后，一键完成 skills + codegraph 的安装与连接。
2. **多宿主**：覆盖 5 大主流宿主：ZCode、Claude Code、Codex、Cursor、Trae。
3. **可维护**：支持更新、卸载，且卸载能精确回滚 `rdcfg` 自己写入的配置。

### 非目标（YAGNI）

- 不做 codegraph 自身的功能（那是 codegraph 的职责）。
- 不从远端动态拉取 skills（skills 内置在 npm 包里分发）。
- 不管理 VSCode 扩展、npm 工程化依赖（ESLint/Prettier 等）。

## 2. 架构方案

**选定方案：方案 A — 薄包装 + 代理委派**

`rdcfg` 是协调层：
- **skills**：内置在 npm 包里，安装 = 拷贝 `SKILL.md` 目录到各宿主。
- **codegraph**：作为外部 stdio MCP server CLI（npm 包 `@colbymchenry/codegraph`，命令 `codegraph`），`rdcfg` 调用 codegraph 自己的 `install`/`init`/`upgrade` 命令完成原生宿主连接；ZCode 因 codegraph 不支持，由 `rdcfg` 自己写 MCP 配置适配。

**理由**：codegraph 已把"装到各宿主"做透（含权限、MCP 配置、项目 init），重造无价值；`rdcfg` 的差异化价值在统一入口、交互式向导、skills 生态、ZCode 适配。

### 可维护性保证

| 管什么 | 更新 | 卸载 |
|---|---|---|
| skills | `rdcfg update <skill>` 重拷贝（或先 `npm i -g rdcfg@latest`） | `rdcfg remove <skill>` 删目标宿主目录 |
| codegraph CLI | 调 `codegraph upgrade`（自带） | `npm uninstall -g @colbymchenry/codegraph`，其 `preuninstall` 自动清理原生宿主配置 |
| ZCode MCP 配置（rdcfg 写的） | 幂等覆盖 | 按 `~/.rdcfg/manifest.json` 清单精确回滚 |

## 3. CLI 命令结构

```
rdcfg                     # 默认：交互式向导（一键聚合入口）
rdcfg list                # 列出所有可用内置 skills（标注已装宿主）
rdcfg add [skill...]      # 装指定 skill 到指定/全部宿主（可省略参数走交互）
rdcfg remove [skill...]   # 卸载 skill
rdcfg update [skill...]   # 更新 skill（默认全部，幂等重拷贝）

rdcfg codegraph           # codegraph 子向导：检测→装 CLI→连宿主→init
rdcfg codegraph status    # 只查不装：CLI装没装/连了哪些宿主/当前项目索引没
rdcfg codegraph install   # 直接执行安装（非交互，CI 友好）
rdcfg codegraph uninstall # 卸载 codegraph（解绑宿主含ZCode + npm uninstall）

rdcfg doctor              # 体检：Node 版本、各宿主目录是否存在、codegraph 命令可用性

rdcfg --version
rdcfg --help
```

设计要点：
- `rdcfg`（无参数）= 核心诉求"交互式向导后一键装"：先问要不要装 skills（多选）→ 要不要搞 codegraph → 选宿主 → 一键执行。
- skills 与 codegraph 是两条独立子命令树，本质不同（文件拷贝 vs 外部 CLI 管理），被 `rdcfg` 向导统一编排。
- `doctor` 用于排障，是这类工具的标配。

## 4. 代码模块划分

```
rdcfg/
├── package.json              # name: rdcfg, bin: { rdcfg: ./dist/cli.js }
├── tsconfig.json
├── src/
│   ├── cli.ts                # 入口：commander 注册命令、分发
│   ├── commands/
│   │   ├── wizard.ts         # `rdcfg` 默认向导（编排 skills+codegraph）
│   │   ├── list.ts           # rdcfg list
│   │   ├── add.ts            # rdcfg add
│   │   ├── remove.ts         # rdcfg remove
│   │   ├── update.ts         # rdcfg update
│   │   ├── codegraph.ts      # rdcfg codegraph [status|install|uninstall]
│   │   └── doctor.ts         # rdcfg doctor
│   ├── skills/
│   │   ├── registry.ts       # 扫描内置 skills/ 目录，构建元数据
│   │   ├── installer.ts      # 拷贝到宿主目录（核心逻辑）
│   │   └── manifest.ts       # 读写 rdcfg.json 清单（记录装了啥）
│   ├── codegraph/
│   │   ├── detector.ts       # 检测 CLI 是否在 PATH、各宿主是否已连、项目是否索引
│   │   ├── installer.ts      # 调 npm/codegraph 完成安装+连接
│   │   └── zcode-adapter.ts  # ZCode 的 MCP 配置写入（codegraph 不支持，rdcfg 自己写）
│   ├── hosts/
│   │   ├── index.ts          # 统一 Host 接口 + 注册表
│   │   ├── claude.ts
│   │   ├── codex.ts
│   │   ├── cursor.ts
│   │   ├── zcode.ts
│   │   └── trae.ts
│   ├── ui/                   # clack 封装：菜单、多选、进度、勾选回显
│   ├── utils/                # fs、exec、platform、logger
│   └── types.ts              # 共享类型：Skill、Host、ManifestEntry
├── skills/                   # 内置精选社区 skills 真身
│   ├── frontend-design/
│   │   └── SKILL.md
│   ├── vue-best-practices/
│   │   └── SKILL.md
│   └── ...
├── docs/
└── README.md
```

设计原则（小而专注的单元）：
- **`hosts/` 统一接口**：每个宿主实现同一个 `Host` 接口，skills 安装和 codegraph 连接都通过这个抽象。新增宿主 = 加一个文件，不碰其他逻辑。
- **skills 与 codegraph 解耦**：`skills/installer.ts` 只管拷贝；`codegraph/installer.ts` 只管调外部 CLI + 写 MCP 配置。唯一耦合点是 `wizard.ts`。
- **`manifest.ts` 是可维护性支点**：清单记录"哪个 skill 装到了哪个宿主"，是 `remove`/`update`/`codegraph uninstall` 精确回滚的依据，也是 `list` 标注"已装"的来源。
- **`zcode-adapter.ts` 独立**：codegraph 不支持 ZCode，这是 `rdcfg` 的差异化价值，单独成文件方便后续 codegraph 改格式时定点维护。

## 5. 核心数据结构

```typescript
// src/types.ts

/** 内置 skill 元数据（从 skills/*/SKILL.md 的 frontmatter 读出） */
interface Skill {
  name: string;           // "vue-best-practices"
  description: string;    // frontmatter 里的 description
  category: string;       // "framework" | "design" | "tooling" | ...
                          // 来自 frontmatter，rdcfg list 按此分组展示
  source: string;         // 原始仓库链接
  dir: string;            // 包内绝对路径
}

/** MCP server 配置（写入各宿主） */
interface McpServerConfig {
  command: string;                  // "codegraph"
  args?: string[];                  // ["serve","--mcp"]
  env?: Record<string, string>;
  type?: 'stdio' | 'http';          // codegraph 是 stdio
  url?: string;                     // http 类型用
}

/** 宿主抽象 —— skills 和 codegraph 共用 */
interface Host {
  id: 'claude' | 'codex' | 'cursor' | 'zcode' | 'trae';
  displayName: string;
  skillsDir: string;                       // 统一：~/<root>/skills/<name>/
  mcpConfigPaths(): string[];              // Trae 返回多个候选；其他单元素
  mcpConfigFormat: 'json' | 'toml';        // Codex='toml'，其余='json'
  mcpConfigKey: string[];                  // ZCode=['mcp','servers']，其余=['mcpServers']
  isAvailable(): boolean;                  // 宿主是否安装在本机
  readMcpConfig(): Promise<Record<string, unknown>>;
  writeMcpServer(name: string, cfg: McpServerConfig): Promise<void>;
  removeMcpServer(name: string): Promise<void>;
}

/** rdcfg 自己维护的清单，存在 ~/.rdcfg/manifest.json */
interface Manifest {
  version: 1;
  installedAt: string;
  skills: ManifestSkillEntry[];
  codegraph: ManifestCodegraphEntry;
}
interface ManifestSkillEntry {
  name: string;
  hosts: Host['id'][];
  installedAt: string;
}
interface ManifestCodegraphEntry {
  cliInstalled: boolean;
  connectedHosts: Host['id'][];
}
```

## 6. 5 宿主配置对照表（已实证确认）

| 宿主 | MCP 配置路径 | MCP JSON key | skills 目录 | skills 格式 |
|---|---|---|---|---|
| **ZCode** | `~/.zcode/cli/config.json` | `mcp.servers.<n>` | `~/.zcode/skills/<n>/` | SKILL.md ✅ |
| **Claude Code** | `~/.claude.json` | `mcpServers.<n>` | `~/.claude/skills/<n>/` | SKILL.md ✅ |
| **Codex** | `~/.codex/config.toml` | `[mcp_servers.<n>]` | `~/.codex/skills/<n>/` | SKILL.md ✅ |
| **Cursor** | `~/.cursor/mcp.json` | `mcpServers.<n>` | `~/.cursor/skills/<n>/` | SKILL.md ✅ |
| **Trae** | `%APPDATA%\Trae CN\User\mcp.json`（+ `TRAE SOLO CN` 变体） | `mcpServers.<n>` | `~/.trae/skills/<n>/` | SKILL.md ✅ |

**关键发现**：
- 5 宿主 skills 全部统一 SKILL.md 格式，安装逻辑高度一致（拷贝 `<skill>/` 整个目录含 SKILL.md + assets + references）。
- 实证：本机 `~/.zcode/skills/`、`~/.cursor/skills/vue-best-practices/`、`~/.trae/skills/guizang-ppt-skill/` 都用此格式。
- 实证：ZCode 的 `~/.zcode/cli/config.json` 第 30-36 行已有 `codegraph` MCP 条目，格式 = `{ command:"codegraph", args:["serve","--mcp"] }`。
- codegraph 原生支持 Claude/Cursor/Codex/Trae 等 8 宿主，**不含 ZCode**，ZCode 由 `rdcfg` 的 `zcode-adapter.ts` 适配。

### 跨平台/变体注意点

1. **Trae 双变体**：`Trae CN` 和 `TRAE SOLO CN` 可能并存，`rdcfg` 探测 `%APPDATA%` 下所有候选，存在的都写入。
2. **Codex 用 TOML**：MCP 配置是 `~/.codex/config.toml`（不是 JSON），Codex host 需要 TOML 读写（用 `@iarna/toml`），其他 4 个都是 JSON。

## 7. 数据流

### 7.1 主流程 —— `rdcfg`（无参数向导）

```
用户敲 rdcfg
   │
   ▼
[1] doctor 轻检测：Node 版本 OK？各宿主谁装了？
   │
   ▼
[2] registry 扫描内置 skills/ → 渲染多选菜单（已装的标注✓）
   │  用户勾选若干 skill
   ▼
[3] 选目标宿主（默认勾选所有"已检测到"的宿主）
   │
   ▼
[4] 问"要不要搞 codegraph？"
   │  是 → codegraph/detector 检测当前状态：
   │       CLI 在 PATH 吗？哪些宿主连了？当前项目有 .codegraph/ 吗？
   │       把"需要做的步骤"列出来让用户确认
   ▼
[5] 执行（一键）：
   ├─ skills/installer：把勾选的 skill 拷到各宿主 skillsDir
   ├─ codegraph/installer：npm i -g → codegraph install（覆盖 codegraph 原生宿主）
   │                       → zcode-adapter 写 ZCode 的 MCP 配置
   │                       → 项目内 codegraph init（若 cwd 是项目）
   └─ manifest.ts：每步成功后更新 ~/.rdcfg/manifest.json
   │
   ▼
[6] 汇总报告：✓ 装了什么、跳过了什么（已装）、下一步提示（重启宿主）
```

### 7.2 幂等与跳过逻辑

每个安装动作执行前先查 manifest + 现场检测，已装就跳过并提示：

| 动作 | 跳过条件 |
|---|---|
| 装 skill X 到宿主 H | `H/skillsDir/X/SKILL.md` 已存在 |
| 装 codegraph CLI | `codegraph --version` 可执行 |
| codegraph 连接宿主 H | H 的 MCP 配置里已有 `codegraph` 条目 |
| codegraph init 项目 | cwd 已存在 `.codegraph/codegraph.db` |

保证 `rdcfg` 反复跑也安全。

### 7.3 ZCode 适配（codegraph 不支持，rdcfg 差异化）

`zcode-adapter.ts` 做 3 件事：
1. 读写 `~/.zcode/cli/config.json`（实证路径）。
2. 写入 `mcp.servers.codegraph = { command:"codegraph", args:["serve","--mcp"] }`（实证格式）。
3. 卸载时精确移除该条目（不动其他 MCP 配置）。

## 8. 错误处理与边界

### 8.1 文件操作类

| 场景 | 处理 |
|---|---|
| skill 已存在且内容相同 | 跳过，日志标 `✓ already up-to-date` |
| skill 已存在但内容不同（用户改过） | 默认跳过并警告 `⚠ 已存在且被修改，跳过（用 rdcfg update --force 覆盖）`；`--force` 才覆盖，覆盖前备份为 `<skill>.bak.<时间戳>` |
| 拷贝中途失败（磁盘满/权限） | 回滚已拷贝部分（删半成品目录），manifest 不写入，报错退出 |
| 目标宿主目录不存在 | skills：自动创建 `skills/` 目录再拷贝；MCP 配置：文件不存在则新建，存在则读取→合并→写回 |

### 8.2 配置合并类（最易翻车）

核心原则：**永远读取→合并→写回，绝不全量覆盖用户的 MCP 配置文件**（文件里可能有用户私密 key）。

```
writeMcpServer(name, cfg):
  1. 读现有文件（不存在→空对象）
  2. JSON：deep-merge，设 cfg[key][name] = cfg
     TOML：解析→设 [mcp_servers.name]→序列化
  3. 写回（保留原有所有 key、注释、缩进风格）
  4. 失败→抛出，不修改原文件（先写临时文件再原子 rename）
```

JSON 用 `JSON5` 解析（容错尾逗号），TOML 用 `@iarna/toml`。

### 8.3 外部命令类（codegraph）

| 场景 | 处理 |
|---|---|
| `codegraph --version` 不在 PATH | 提示并自动 `npm i -g @colbymchenry/codegraph`；npm 也失败→打印手动安装命令退出 |
| `npm i -g` 权限不足（Linux/Mac） | 提示用 sudo 或切 nvm；Windows 通常无此问题 |
| `codegraph install` 失败 | 不中断整个 `rdcfg` 流程，标 `✗ codegraph 连接失败`，其余 skills 安装继续；报告里高亮 |
| 网络/超时 | npm install 设 60s 超时，超时给出"检查网络/代理"提示 |
| codegraph 版本太旧 | 不阻塞（codegraph 自带 `upgrade`），仅 `doctor` 里 warning |

### 8.4 跨平台边界

- 路径分隔符：用 `node:path`，不硬编码 `/` 或 `\`。
- home 目录：用 `os.homedir()`，不用 `~`；AppData 用 `process.env.APPDATA`。
- Trae 双变体：都探测，各自独立写入。
- Windows 权限：`npm i -g` 失败捕获 EPERM 给提示。

### 8.5 清单一致性

`~/.rdcfg/manifest.json` 是真相来源，但现场可能与清单不符（用户手动删过 skill）：
- 每次 `list`/`wizard` 启动做轻量校验：清单记的 skill 在目标目录不存在→标 `⚠ 清单过期`，提示 `rdcfg doctor --fix` 清理。
- 不自动清理（避免误删信息），只提示。

### 8.6 用户中断

Ctrl+C 中断：clack 的 `cancel()` 退出，已写入文件不回滚（部分安装是合法状态，下次跑幂等补齐）。manifest 最后统一写入，中断则不记录该次。

## 9. 测试策略

### 9.1 分层

| 层级 | 范围 | 工具 |
|---|---|---|
| 单元测试 | 纯函数：路径计算、JSON/TOML 合并、frontmatter 解析、幂等判断、manifest 读写 | vitest |
| 集成测试 | 各 Host 的 `writeMcpServer`/`removeMcpServer`（在临时 home 目录上跑真实文件操作） | vitest + 临时目录 |
| E2E（少量） | `rdcfg`、`rdcfg add`、`rdcfg codegraph status` 全流程（mock codegraph CLI） | vitest + execa |

### 9.2 关键单测用例（必须覆盖）

**配置合并（8.2 核心，最易回归）**：
- 空 MCP 文件 → 写入 codegraph → 只多一个 key
- 已有其他 MCP 条目（如 zai-mcp）→ 写入 codegraph → 其他条目原样保留
- Trae 双变体目录都存在 → 都写入
- Codex TOML 写入 → 解析回来结构正确
- 写入失败（mock 只读目录）→ 原文件不变

**幂等性**：
- 同一 skill 装两次 → 第二次跳过
- codegraph 已连 → `rdcfg codegraph` 检测到跳过
- 同一 MCP 条目写两次 → 不重复

**清单一致性**：
- 装一个 skill → manifest 记录正确
- 手动删 skill 文件 → `doctor` 报告清单过期

### 9.3 测试基础设施

```typescript
// 关键：每个测试用独立的 fake HOME，绝不碰真实 ~/.zcode 等
beforeEach(() => {
  process.env.HOME = tmpdir();
  process.env.APPDATA = path.join(tmpdir(), 'AppData/Roaming');
  process.env.USERPROFILE = tmpdir();
});
```

**绝对红线**：测试中禁止写入真实的 `~/.zcode`、`~/.cursor`、`~/.claude`、`~/.codex`、`~/.trae`。所有测试跑在临时目录里。

### 9.4 不测什么

- 不测 codegraph 自身功能。
- 不测 clack 的 UI 渲染。
- 不做快照测试。

## 10. 技术栈与依赖

| 用途 | 选型 |
|---|---|
| 运行时 | Node.js >= 20 |
| 语言 | TypeScript（严格模式） |
| CLI 框架 | commander |
| 交互式 UI | @clack/prompts（与 codegraph 一致，体验好） |
| JSON 解析（容错） | json5 |
| TOML 读写（Codex） | @iarna/toml |
| 路径 | node:path + os.homedir() |
| 执行子进程 | execa |
| 测试 | vitest |
| 构建 | tsup（基于 esbuild，快） |

## 11. 已知风险与开放问题

1. **codegraph 升级变更配置格式**：若 codegraph 改了 MCP 配置写入方式，`rdcfg` 的 ZCode 适配可能需跟。缓解：`zcode-adapter.ts` 独立成文件，定点维护；codegraph 是 stdio MCP，配置极简。
2. **Trae 配置变体**：`Trae CN` / `TRAE SOLO CN` / 未来可能的新变体。缓解：`mcpConfigPaths()` 返回候选数组，新增变体只改一个函数。
3. **codegraph 原生宿主与 rdcfg 行为重叠**：codegraph 自己也能连 Claude/Cursor 等，`rdcfg` 调 `codegraph install` 时不重复写（幂等检测兜底）。
4. **npm 全局安装路径**：不同平台/包管理器（nvm/fnm/volta）路径不同，`codegraph --version` 探测比猜测路径更可靠。

## 12. MVP 范围

**包含**：
- 5 宿主 skills 安装/卸载/更新（统一 SKILL.md 拷贝）
- codegraph 安装/连接/卸载（委派 codegraph CLI + ZCode 适配）
- 交互式向导 `rdcfg`
- `rdcfg list` / `rdcfg add` / `rdcfg remove` / `rdcfg update` / `rdcfg codegraph *` / `rdcfg doctor`
- 清单管理 `~/.rdcfg/manifest.json`
- 跨平台（Windows 优先，Mac/Linux 兼容）
- 单元 + 集成测试

**暂不包含（后续迭代）**：
- 远端 skills 拉取（GitHub URL 安装）
- skills 内容创作/编辑工具
- VSCode 扩展、npm 工程化依赖管理
- GUI
