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
| `rdcfg add [skills...]` | 装指定 skill（`-H zcode,claude` 指定宿主，`-f` 强制覆盖） |
| `rdcfg remove [skills...]` | 卸载 skill |
| `rdcfg update [skills...]` | 更新 skill |
| `rdcfg codegraph status` | 查看 codegraph 安装与连接状态 |
| `rdcfg codegraph install` | 安装 codegraph 并连接宿主 |
| `rdcfg codegraph uninstall` | 卸载 codegraph 并清理配置 |
| `rdcfg doctor` | 环境体检 |

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

- rdcfg 清单：`~/.rdcfg/manifest.json`
- 各宿主配置见 `docs/superpowers/specs/2026-07-07-fg-cli-design.md` 第 6 节

## 开发

```bash
npm install
npm test        # 运行测试
npm run build   # 构建
npm run typecheck
```
