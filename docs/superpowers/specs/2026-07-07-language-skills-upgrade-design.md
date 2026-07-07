# rdcfg — skills 多语言扩展升级设计文档

- **日期**：2026-07-07
- **状态**：待审阅
- **作者**：brainstorming 产出
- **范围**：在现有 rdcfg CLI 基础上，将 skills 从"仅前端"扩展到覆盖 5 种主流语言，并在安装流程中加入"选择语言"步骤。

## 1. 背景与目标

当前 `rdcfg` CLI 内置 3 个前端 skills（`element-plus-vue3`、`frontend-design`、`vue-best-practices`），交互流程为：选 scope（global/project）→ 选 skills（全部）→ 选 hosts → 安装。

本次升级要解决两个诉求：

1. **覆盖更多主流语言**：在现有前端基础上，增加 Python、Go、PHP、Flutter 四种语言/技术栈的 skills。
2. **语言维度的筛选**：选完 scope 后增加一步"选择语言"，根据语言过滤显示对应的 skills，避免在长列表里翻找。

### 核心决策（已与用户对齐）

| 决策项 | 结论 |
|---|---|
| 语言分类模型 | 前端作为大类（"技术栈类别"维度），非纯编程语言 |
| 覆盖语言 | 前端、Python、Go、PHP、Flutter（共 5 类） |
| SKILL 来源 | 内置 `skills/` 目录（与现有一致，随 npm 包分发） |
| 语言选择交互 | 单选语言 → 过滤显示；始终列出全部 5 种（空语言友好提示） |
| CLI flag | 新增 `-l/--language <lang>`，非交互指定语言 |
| 数据模型 | frontmatter 加显式 `language` 字段，目录保持扁平 |
| 新 skill 内容量级 | 骨架级（与现有 3 个同体量，约 10 行），每语言 3 个 git 热门主题 |

### 非目标（YAGNI）

- **不写详尽 skill 内容**：本次只填充骨架级 SKILL.md（frontmatter + 标题 + 一句简介），内容后期再丰富。
- **不动安装路径逻辑**：global/project 的路径解析（`installer.ts`、`manifest.ts`、`hosts/*`）完全不改，本次只动"选哪些 skill"。
- **不给 `remove`/`update` 加 `-l` flag**：保持最小改动面。
- **不加远程拉取**：skills 仍内置在包里，不从 GitHub 动态下载。
- **不加"未分类"语言兜底项**：无 `language` 字段的 skill 不会出现在任何语言筛选结果中（鼓励补字段）。

## 2. 数据模型变更（§1）

### `Skill` 类型新增 `language` 字段

`src/types.ts`：

```ts
export interface Skill {
  name: string;
  description: string;
  category: string;     // framework/design/tool（保留原语义）
  language: string;     // 新增：frontend/python/go/php/flutter
  source: string;
  dir: string;
}
```

`category`（framework/design/tool）与 `language`（frontend/go/...）正交，各管各的维度，语义不冲突。

### frontmatter 解析扩展

`src/skills/registry.ts` 的 `parseFrontmatter` 增加对 `language` 键的解析。现有解析器是平铺 `key: value`，加一个字段零摩擦。

### `LANGUAGES` 常量

新增 `src/skills/languages.ts`：

```ts
export const LANGUAGES = ['frontend', 'python', 'go', 'php', 'flutter'] as const;
export type Language = typeof LANGUAGES[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  frontend: '前端',
  python: 'Python',
  go: 'Go',
  php: 'PHP',
  flutter: 'Flutter',
};

// 返回每个语言及其下 skill 计数，供 UI 显示 hint
export function listLanguages(): Array<{ id: Language; label: string; count: number }>;
```

### 现有 3 个 skill 补 `language: frontend`

每个 frontmatter 加一行，路径不变、测试不受影响。

## 3. 交互流程变更（§2）

### 流程对比

**当前**：`scope → selectSkills(全部) → selectHosts → 安装`

**新**：`scope → selectLanguage(单选) → selectSkills(该语言过滤后) → selectHosts → 安装`

### 新增 UI 组件 `selectLanguage()`

`src/ui/prompts.ts`：

- 单选菜单，5 个选项，**始终列出全部**（不按是否有 skills 过滤）。
- 每个选项 hint 显示该语言下 skill 数量，例如 `前端 · 3 个 skill`、`Go · 3 个 skill`。
- 默认选中 `frontend`。

### `selectSkills` 改造

接收 `language` 参数，调用前先 `listSkills().filter(s => s.language === language)`。过滤后若为空，走"该语言暂无 skills，敬请期待"的友好提示并 `cancel`。

### 命令改造

- **`add.ts` 的 `runAdd`**（交互模式）：scope → language → skills(filtered) → hosts。
- **`wizard.ts`**：同步插入 language 步骤（在 scope 之后、skills 之前）。

### `list` 命令增强

列表输出给每个 skill 标注语言标签：

```
[global] [frontend] vue-best-practices — Vue 3 组合式 API 最佳实践
[global] [go]       go-project-layout — Go 项目目录结构约定
```

## 4. CLI flag 变更（§3）

### `add` 命令新增 `-l/--language`

`src/cli.ts`：

```ts
program
  .command('add [skills...]')
  .option('-H, --hosts <ids>', '目标宿主，逗号分隔（zcode,claude,codex,cursor,trae）')
  .option('-f, --force', '覆盖已修改的 skill')
  .option('-p, --project', '装入当前项目目录（默认装到全局 ~/.xxx/skills）')
  .option('-l, --language <lang>', '按语言过滤（frontend,python,go,php,flutter）')  // 新增
  .action(async (skills, opts) => {
    const hostIds = opts.hosts ? opts.hosts.split(',').map(s => s.trim()) as HostId[] : undefined;
    await runAdd(skills, {
      hosts: hostIds,
      force: opts.force,
      scope: opts.project ? 'project' : 'global',
      language: opts.language,   // 新增
    });
  });
```

### 行为矩阵

| `-l` | skills 参数 | 行为 |
|---|---|---|
| 已指定 | 已指定 | 纯非交互。校验 `language` 合法（在 LANGUAGES 内）；指定的 skill 若不属于该语言，报错提示 |
| 已指定 | 未指定 | 跳过语言交互提问，直接进入"显示该语言 skills 多选" |
| 未指定 | 交互模式 | 走完整 scope → language → skills 流程 |
| 未指定 | 非交互（skills 已给） | 保持原行为不变，不过滤（向后兼容） |

### 校验

- `language` 值若不在 `LANGUAGES` 内，提前报错退出，列出合法值。
- 指定 skill 不属于该 language（如 `-l go vue-best-practices`）→ 报错。

### `InstallOptions` / `runAdd` 签名扩展

`src/skills/installer.ts` 的 `InstallOptions` 与 `src/commands/add.ts` 的 `runAdd` 参数新增可选字段：

```ts
interface InstallOptions {
  scope: Scope;
  cwd?: string;
  force?: boolean;
  language?: string;   // 新增，可选
}
```

`language` 为可选字段，未传时不过滤（向后兼容）。`installer` 内部安装逻辑不使用 `language`（它只管"装到哪、怎么装"），`language` 仅用于 `runAdd` 层的"筛选与校验"。

### `remove` / `update` 命令

**不加 `-l` flag**，保持最小改动面。这两个命令的语义是"针对已安装的 skill 操作"，不强制按语言。

## 5. Skills 内容填充（§4）

骨架级（与现有 3 个同体量：frontmatter + 标题 + 一句简介，约 10 行）。

### A. 现有 3 个补 `language: frontend`

- `skills/element-plus-vue3/SKILL.md`
- `skills/frontend-design/SKILL.md`
- `skills/vue-best-practices/SKILL.md`

### B. 新增 12 个 skills 目录

frontmatter 模板：

```yaml
---
name: <kebab-name>
description: <中文一句话简介>
category: <framework/design/tool>
language: <python|go|php|flutter>
source: <真实 GitHub 仓库 URL（不带 https://，与现有风格一致）>
---

# <标题>

<一句中文简介，覆盖范围>
```

### 完整清单

| 语言 | skill | category | source |
|---|---|---|---|
| Python | `fastapi-best-practices` | framework | github.com/tiangolo/fastapi |
| Python | `python-data-science` | tool | github.com/pandas-dev/pandas |
| Python | `python-testing-pytest` | tool | github.com/pytest-dev/pytest |
| Go | `go-project-layout` | design | github.com/golang-standards/project-layout |
| Go | `go-concurrency-patterns` | framework | go.dev |
| Go | `gin-rest-api` | framework | github.com/gin-gonic/gin |
| PHP | `laravel-best-practices` | framework | github.com/laravel/laravel |
| PHP | `symfony-fundamentals` | framework | github.com/symfony/symfony |
| PHP | `php-psr-coding-standards` | design | github.com/php-fig/fig-standards |
| Flutter | `flutter-riverpod` | framework | github.com/rrousselGit/riverpod |
| Flutter | `flutter-go-router` | framework | github.com/flutter/packages |
| Flutter | `flutter-testing` | tool | flutter.dev |

每个主题均为 GitHub/pub.dev 上真实高热度的方向（FastAPI ~100k star、golang-standards/project-layout ~55k star、Laravel ~80k star、Riverpod 为 pub.dev 点赞最多的包等），三主题之间互补不重叠。

### `source` 字段风格

不带 `https://`，与现有 3 个（`github.com/community/...`）风格一致。少数无单一权威仓库的（go-concurrency-patterns、flutter-testing）指向官方文档站点。

## 6. 测试与验证（§5）

### A. 单元测试

1. **`tests/skills/registry.test.ts` 扩展**：
   - `listSkills()` 返回的每个 skill 都含 `language` 字段
   - frontmatter 解析能正确读取 `language` 键
   - 现有 3 个 frontend skill 的 `language === 'frontend'`

2. **新增 `tests/skills/languages.test.ts`**：
   - `LANGUAGES` 常量值与顺序
   - `LANGUAGE_LABELS` 覆盖所有 language
   - `listLanguages()` 返回的每个语言含 skill 计数

3. **`tests/ui/prompts.test.ts` 扩展**（若存在）：
   - `selectLanguage` 返回合法值（mock clack）

### B. 命令测试

4. **`tests/commands/add.test.ts`**（新建或扩展）：
   - 交互模式：`-l go` + 未指定 skills → 进入 skills 多选，选项仅含 go 的 3 个
   - 非交互：`-l go go-project-layout gin-rest-api` → 只装这 2 个
   - 非法 `language`（如 `-l rust`）→ 提前报错退出
   - 指定 skill 不属于该 language（如 `-l go vue-best-practices`）→ 报错

### C. 端到端测试

5. **`tests/e2e/smoke.test.ts` 扩展**：
   - 新语言 skill 的 project 安装：`installSkill('go-project-layout', ['zcode'], { scope: 'project', cwd })` 落到 `<cwd>/.zcode/skills/go-project-layout/SKILL.md`
   - 验证 15 个 skill（3 原有 + 12 新增）都被 `listSkills()` 正常扫描到

### D. 手动验证清单

- [ ] `rdcfg list` 显示 15 个 skill，带语言标签
- [ ] `rdcfg add`（交互）走 scope → language(5 选) → skills(filtered) → hosts
- [ ] `rdcfg add -l go`（交互 skills）只显示 go 的 3 个
- [ ] `rdcfg add -l rust foo` 报错列出合法语言
- [ ] `rdcfg add -l go vue-best-practices` 报错（skill 不属于 go）
- [ ] `rdcfg wizard` 流程正常
- [ ] `npm run test` 全绿

## 7. 实施步骤与影响面（§6）

### A. 实施顺序

由内到外，每步可独立验证：

| # | 步骤 | 涉及文件 | 验证点 |
|---|---|---|---|
| 1 | 类型 + 常量 | `src/types.ts`、新增 `src/skills/languages.ts` | `tsc` 通过 |
| 2 | registry 解析 language | `src/skills/registry.ts` | 现有测试仍绿 |
| 3 | UI: `selectLanguage` + 改造 `selectSkills` | `src/ui/prompts.ts` | - |
| 4 | 给现有 3 个 skill 补 `language: frontend` | `skills/*/SKILL.md` | registry 扫描含 language |
| 5 | 新增 12 个 skill 目录 | `skills/*/SKILL.md` | `listSkills()` 返回 15 个 |
| 6 | `add` 命令接线 + `-l` flag | `src/cli.ts`、`src/commands/add.ts` | 交互/非交互两种路径 |
| 7 | `wizard` 接线 | `src/commands/wizard.ts` | wizard 流程正常 |
| 8 | `list` 输出语言标签 | `src/commands/list.ts` | list 显示标签 |
| 9 | 测试补全 | `tests/**` | `npm run test` 全绿 |
| 10 | 手动验证清单 | - | 7 项全过 |

### B. 影响面分析

- **全局/项目安装路径逻辑**（`installer.ts`、`manifest.ts`、`hosts/*`）：**完全不动**。本次升级只动"选哪些 skill"，不动"装到哪里、怎么装"。
- **`remove` / `update` / `doctor` / `codegraph` 命令**：**不动**。
- **向后兼容**：所有新增都是可选/加字段。`-l` 未指定时行为不变；frontmatter 缺 `language` 的旧 skill 解析不报错（按空字符串处理）。
- **构建/发布**：`tsup` 打包不受影响；`package.json` 的 `files` 字段已含 `skills` 目录，12 个新目录自动随包发布。

### C. 风险与边界

- **frontmatter 缺 `language` 的容错**：若用户自己塞了一个没 `language` 字段的 skill 到 `skills/`，`parseFrontmatter` 返回空字符串。语言过滤时这类 skill 在任何语言下都不显示。**决策**：不加"未分类"兜底项，鼓励补字段。
