# rdcfg — 前端 skills 与 codegraph 一键安装 CLI

一条命令为 ZCode / Claude Code / Codex / Cursor / Trae 安装前端 skills（内置精选社区 SKILL.md）和 codegraph 代码图谱插件（MCP server）。

## 快速开始

```bash
# 全局安装
npm install -g rdcfg

# 交互式向导（推荐）
rdcfg

# 或 npx 直接跑
npx rdcfg
```

## 命令

| 命令 | 说明 |
|---|---|
| `rdcfg` | 交互式向导：选 skills → 选宿主 → 配 codegraph → 一键执行 |
| `rdcfg list` | 列出所有可用内置 skills（标注已装宿主） |
| `rdcfg add [skills...]` | 装指定 skill（`-H zcode,claude` 指定宿主，`-f` 强制覆盖，`-p` 装入当前项目） |
| `rdcfg remove [skills...]` | 卸载 skill（`-p` 从当前项目卸载） |
| `rdcfg update [skills...]` | 更新 skill（`-p` 更新当前项目内的） |
| `rdcfg codegraph status` | 查看 codegraph 安装与连接状态 |
| `rdcfg codegraph install` | 安装 codegraph 并连接宿主 |
| `rdcfg codegraph uninstall` | 卸载 codegraph 并清理配置 |
| `rdcfg doctor` | 环境体检 |

## 全局 vs 项目级安装

skills 支持两种安装作用域：

- **全局**（默认）：装到家目录，所有项目共享。如 `~/.zcode/skills`、`~/.claude/skills`。
- **项目级**（`-p` / `--project`）：装到当前项目目录，随项目走、可提交到 git、团队共享。如 `<项目>/.zcode/skills`、`<项目>/.claude/skills`。

```bash
# 装到全局（默认）
rdcfg add vue-best-practices -H zcode,claude

# 装到当前项目（跟着仓库走，队友 pull 后即有）
rdcfg add vue-best-practices -H zcode,claude -p

# 卸载/更新同理
rdcfg remove vue-best-practices -p
rdcfg update -p
```

各宿主的项目级 skills 目录约定（与全局对称）：

| 宿主 | 全局 | 项目级 |
|---|---|---|
| ZCode | `~/.zcode/skills` | `<cwd>/.zcode/skills` |
| Claude Code | `~/.claude/skills` | `<cwd>/.claude/skills` |
| Codex CLI | `~/.codex/skills` | `<cwd>/.codex/skills` |
| Cursor | `~/.cursor/skills` | `<cwd>/.cursor/skills` |
| Trae | `~/.trae/skills` | `<cwd>/.trae/skills` |

> **关于 gitignore**：项目级安装记录在 `<cwd>/.rdcfg/manifest.json`（建议提交，让团队共享清单）；具体的 skills 目录（如 `.zcode/skills/`）是否忽略由你的项目决定 —— 想让队友直接拿到 skill 文件就提交，想让他们用 `rdcfg` 重装就忽略。CLI 不会主动改你的 `.gitignore`。

## 支持的宿主

| 宿主 | skills | codegraph |
|---|---|---|
| ZCode | ✅ | ✅（rdcfg 适配） |
| Claude Code | ✅ | ✅ |
| Codex CLI | ✅ | ✅ |
| Cursor | ✅ | ✅ |
| Trae | ✅ | ✅ |

## 工作原理

- **skills**：内置在 npm 包里，安装 = 拷贝 SKILL.md 目录到各宿主的 skills/ 目录。
- **codegraph**：作为外部 MCP server CLI（`@colbymchenry/codegraph`），rdcfg 调用其 install/init 命令连接原生宿主；ZCode 由 rdcfg 自己写 MCP 配置。

## 配置位置

- rdcfg 全局清单：`~/.rdcfg/manifest.json`
- rdcfg 项目清单：`<cwd>/.rdcfg/manifest.json`（项目级安装时生成，可 commit）
- 各宿主配置见 `docs/superpowers/specs/2026-07-07-fg-cli-design.md` 第 6 节

## 开发

```bash
npm install
npm test        # 运行测试
npm run build   # 构建
npm run typecheck
```
