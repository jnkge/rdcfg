# skills 多语言扩展升级 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 rdcfg 的内置 skills 从"仅前端 3 个"扩展到"5 种语言 15 个"，在安装流程的 scope 之后加一步"选择语言"过滤，并支持 `-l/--language` flag 非交互指定。

**Architecture:** frontmatter 加显式 `language` 字段（目录保持扁平）；registry 解析该字段；UI 新增 `selectLanguage` 单选；`add`/`wizard` 流程插入语言步骤；`cli.ts` 加 `-l` flag。**完全不动**安装路径逻辑（installer/manifest/hosts）。

**Tech Stack:** TypeScript 5.4 (ESM)、commander@12、@clack/prompts@0.7、vitest、tsup。

## Global Constraints

- 语言 ID 小写，固定 5 个：`frontend`、`python`、`go`、`php`、`flutter`（来自 spec §1 的 `LANGUAGES` 常量）。
- `category`（framework/design/tool/other）与 `language` 正交，各自独立维度。
- 新增 skill 内容为**骨架级**（frontmatter + 标题 + 一句简介，约 10 行），与现有 3 个同体量。
- `source` 字段不带 `https://`（与现有风格一致，现有的是 `https://github.com/community/...`——本计划保持现有 3 个原样，只加 `language` 行；新 skill 的 source 用裸域名如 `github.com/tiangolo/fastapi`）。
- 安装路径逻辑（`installer.ts` 的 `resolveSkillsDir`、`manifest.ts`、`hosts/*`）**一行都不改**。
- `remove`/`update`/`doctor`/`codegraph` 命令**不加 `-l`**。
- 每个任务结束都要 `git commit`，commit message 用约定式格式（`feat:`/`test:`/`docs:`）。
- 所有代码与注释用中文（与现有代码风格一致）。

## File Structure

| 文件 | 操作 | 职责 |
|---|---|---|
| `src/types.ts` | Modify | `Skill` 接口加 `language` 字段 |
| `src/skills/languages.ts` | Create | `LANGUAGES` 常量、`LANGUAGE_LABELS`、`listLanguages()` |
| `src/skills/registry.ts` | Modify | `listSkills()` 读 `language` 字段 |
| `src/ui/prompts.ts` | Modify | 新增 `selectLanguage()`，`selectSkills` 不变（由调用方过滤后传入） |
| `skills/{element-plus-vue3,frontend-design,vue-best-practices}/SKILL.md` | Modify | frontmatter 加 `language: frontend` |
| `skills/{python,go,php,flutter}/*/SKILL.md` | Create | 12 个新 skill 骨架 |
| `src/commands/add.ts` | Modify | `AddOptions` 加 `language?`；交互流程插入语言步骤；非交互校验 |
| `src/cli.ts` | Modify | `add` 命令加 `-l/--language` option |
| `src/commands/wizard.ts` | Modify | scope 之后插入语言步骤 |
| `src/commands/list.ts` | Modify | 输出加语言标签 |
| `tests/skills/languages.test.ts` | Create | 语言常量与 `listLanguages` 测试 |
| `tests/skills/registry.test.ts` | Modify | 补 language 字段测试 |
| `tests/commands/add.test.ts` | Create | `-l` 行为与校验测试 |
| `tests/e2e/smoke.test.ts` | Modify | 新 skill 数量 + project 安装验证 |

---

## Task 1: 类型与语言常量

**Files:**
- Modify: `src/types.ts:2-8`
- Create: `src/skills/languages.ts`
- Test: `tests/skills/languages.test.ts`

**Interfaces:**
- Produces: `Skill.language: string`（types.ts）、`LANGUAGES`（readonly tuple）、`Language`（类型）、`LANGUAGE_LABELS`（Record）、`listLanguages()`（返回 `{id, label, count}[]`）

- [ ] **Step 1: 写失败测试 `tests/skills/languages.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { LANGUAGES, LANGUAGE_LABELS, listLanguages } from '../../src/skills/languages.js';

describe('languages', () => {
  it('LANGUAGES 包含 5 种且顺序固定', () => {
    expect(LANGUAGES).toEqual(['frontend', 'python', 'go', 'php', 'flutter']);
  });

  it('LANGUAGE_LABELS 覆盖所有 language', () => {
    for (const id of LANGUAGES) {
      expect(LANGUAGE_LABELS[id]).toBeTruthy();
    }
  });

  it('listLanguages 返回每个语言含计数', () => {
    const list = listLanguages();
    expect(list).toHaveLength(5);
    expect(list.map(x => x.id)).toEqual(['frontend', 'python', 'go', 'php', 'flutter']);
    // frontend 至少有 3 个（现有）
    const fe = list.find(x => x.id === 'frontend')!;
    expect(fe.count).toBeGreaterThanOrEqual(3);
    // 每项都有非空 label
    for (const x of list) expect(x.label).toBeTruthy();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/skills/languages.test.ts`
Expected: FAIL，提示找不到 `../../src/skills/languages.js` 模块。

- [ ] **Step 3: 改 `src/types.ts`，给 `Skill` 加 `language` 字段**

把 `src/types.ts:2-8` 的：
```ts
export interface Skill {
  name: string;
  description: string;
  category: string;
  source: string;
  dir: string;
}
```
改为：
```ts
export interface Skill {
  name: string;
  description: string;
  category: string;
  language: string;
  source: string;
  dir: string;
}
```

- [ ] **Step 4: 创建 `src/skills/languages.ts`**

```ts
import { listSkills } from './registry.js';

/** 支持的语言 ID（技术栈类别维度，非纯编程语言） */
export const LANGUAGES = ['frontend', 'python', 'go', 'php', 'flutter'] as const;
export type Language = (typeof LANGUAGES)[number];

/** 语言 ID → 中文展示名 */
export const LANGUAGE_LABELS: Record<Language, string> = {
  frontend: '前端',
  python: 'Python',
  go: 'Go',
  php: 'PHP',
  flutter: 'Flutter',
};

/** 是否合法语言 ID */
export function isLanguage(id: string): id is Language {
  return (LANGUAGES as readonly string[]).includes(id);
}

/** 列出所有语言及其下 skill 计数，供 UI 显示 hint */
export function listLanguages(): Array<{ id: Language; label: string; count: number }> {
  const skills = listSkills();
  return LANGUAGES.map(id => ({
    id,
    label: LANGUAGE_LABELS[id],
    count: skills.filter(s => s.language === id).length,
  }));
}
```

注意：`listLanguages` import 了 `listSkills`，而 `listSkills` 在 Task 2 才会读 `language` 字段。Task 1 阶段 `listSkills` 还没改，`count` 会全是 0，但 `frontend >= 3` 这个断言会失败——这是预期的，等 Task 2 改完 registry、Task 3 给现有 3 个 skill 补字段后会通过。**为避免 Task 1 测试卡住，把 `frontend >= 3` 的断言暂时降为 `>= 0`，并在 Task 3 末尾改回 `>= 3`。**

实际写入的测试第三段用：
```ts
  it('listLanguages 返回每个语言含计数', () => {
    const list = listLanguages();
    expect(list).toHaveLength(5);
    expect(list.map(x => x.id)).toEqual(['frontend', 'python', 'go', 'php', 'flutter']);
    const fe = list.find(x => x.id === 'frontend')!;
    expect(fe.count).toBeGreaterThanOrEqual(0); // Task 3 后改回 >= 3
    for (const x of list) expect(x.label).toBeTruthy();
  });
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/skills/languages.test.ts`
Expected: PASS（3 个用例全过）。

注意：此时 `registry.ts` 还没改，`listSkills()` 返回的 skill 对象缺 `language` 字段会导致 TS 编译报错（`Skill` 接口已要求 `language`）。所以 **Step 3 和 Step 4 必须与 Task 2 Step 1 一起在同一批完成**。为简化，把 Task 2 的 registry 改动紧接 Task 1 做。

- [ ] **Step 6: 提交**

```bash
git add src/types.ts src/skills/languages.ts tests/skills/languages.test.ts
git commit -m "feat: add language field and LANGUAGES constants"
```

---

## Task 2: registry 解析 language 字段

**Files:**
- Modify: `src/skills/registry.ts:66-85`
- Test: `tests/skills/registry.test.ts`

**Interfaces:**
- Consumes: `Skill.language`（Task 1 产出）
- Produces: `listSkills()` 返回值含 `language` 字段（空 frontmatter 时为 `'other'`，与 category 同策略）

- [ ] **Step 1: 改 `src/skills/registry.ts` 的 `listSkills`**

把 `src/skills/registry.ts:76-82` 的 push 块：
```ts
    skills.push({
      name: data.name || name,
      description: data.description || '',
      category: data.category || 'other',
      source: data.source || '',
      dir,
    });
```
改为：
```ts
    skills.push({
      name: data.name || name,
      description: data.description || '',
      category: data.category || 'other',
      language: data.language || 'other',
      source: data.source || '',
      dir,
    });
```

- [ ] **Step 2: 补测试 `tests/skills/registry.test.ts`**

在文件末尾（第 34 行 `});` 之前）插入新用例：
```ts

  it('解析 language 字段', () => {
    const text = `---
name: go-project-layout
description: Go 项目布局
category: design
language: go
source: github.com/golang-standards/project-layout
---

# Body`;
    const { data } = parseFrontmatter(text);
    expect(data.language).toBe('go');
  });
```

- [ ] **Step 3: 跑测试确认通过**

Run: `npx vitest run tests/skills/registry.test.ts`
Expected: PASS（4 个用例全过）。

- [ ] **Step 4: 全量回归**

Run: `npx vitest run`
Expected: 可能出现 TS 编译错误——因为现有 3 个 `skills/*/SKILL.md` 还没加 `language` 字段，`listSkills()` 返回的 `language` 会是 `'other'`，但这不报错（解析器兜底）。测试应全绿（languages.test.ts 的 `>= 0` 断言通过）。

- [ ] **Step 5: 提交**

```bash
git add src/skills/registry.ts tests/skills/registry.test.ts
git commit -m "feat: parse language field from skill frontmatter"
```

---

## Task 3: 现有 3 个前端 skill 补 language 字段

**Files:**
- Modify: `skills/element-plus-vue3/SKILL.md`
- Modify: `skills/frontend-design/SKILL.md`
- Modify: `skills/vue-best-practices/SKILL.md`
- Modify: `tests/skills/languages.test.ts`（把 `>= 0` 改回 `>= 3`）

**Interfaces:**
- Produces: 3 个 frontend skill 的 `language === 'frontend'`

- [ ] **Step 1: 写失败测试**

在 `tests/skills/registry.test.ts` 末尾新增一个 describe 块：
```ts

import { listSkills } from '../../src/skills/registry.js';

describe('listSkills language', () => {
  it('现有 3 个前端 skill 的 language === frontend', () => {
    const skills = listSkills();
    const names = ['element-plus-vue3', 'frontend-design', 'vue-best-practices'];
    for (const name of names) {
      const s = skills.find(x => x.name === name);
      expect(s, `skill ${name} 应存在`).toBeDefined();
      expect(s!.language).toBe('frontend');
    }
  });
});
```

注：`import { listSkills }` 要加到文件顶部的 import 区。现有顶部是：
```ts
import { parseFrontmatter } from '../../src/skills/registry.js';
```
改为：
```ts
import { parseFrontmatter, listSkills } from '../../src/skills/registry.js';
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/skills/registry.test.ts`
Expected: FAIL，`language` 为 `'other'`（因为 frontmatter 还没加）。

- [ ] **Step 3: 给 3 个 SKILL.md 加 `language: frontend`**

`skills/element-plus-vue3/SKILL.md` 在 `category: framework` 行之后加一行 `language: frontend`：
```yaml
---
name: element-plus-vue3
description: Element Plus + Vue 3 组件库使用指南，含主题定制与按需引入。
category: framework
language: frontend
source: https://github.com/community/element-plus-vue3
---
```

`skills/frontend-design/SKILL.md`：
```yaml
---
name: frontend-design
description: 前端设计模式与组件最佳实践指导，覆盖布局、配色、响应式。
category: design
language: frontend
source: https://github.com/community/frontend-design
---
```

`skills/vue-best-practices/SKILL.md`：
```yaml
---
name: vue-best-practices
description: Vue 3 组合式 API 最佳实践，含 Pinia/Vue Router 集成模式。
category: framework
language: frontend
source: https://github.com/community/vue-best-practices
---
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/skills/registry.test.ts`
Expected: PASS。

- [ ] **Step 5: 把 languages.test.ts 的 `>= 0` 改回 `>= 3`**

`tests/skills/languages.test.ts` 中：
```ts
    expect(fe.count).toBeGreaterThanOrEqual(0); // Task 3 后改回 >= 3
```
改为：
```ts
    expect(fe.count).toBeGreaterThanOrEqual(3);
```

- [ ] **Step 6: 跑 languages 测试确认通过**

Run: `npx vitest run tests/skills/languages.test.ts`
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add skills/element-plus-vue3/SKILL.md skills/frontend-design/SKILL.md skills/vue-best-practices/SKILL.md tests/skills/registry.test.ts tests/skills/languages.test.ts
git commit -m "feat: tag existing frontend skills with language: frontend"
```

---

## Task 4: 新增 12 个 skill 骨架

**Files:**
- Create: `skills/python/fastapi-best-practices/SKILL.md`
- Create: `skills/python/python-data-science/SKILL.md`
- Create: `skills/python/python-testing-pytest/SKILL.md`
- Create: `skills/go/go-project-layout/SKILL.md`
- Create: `skills/go/go-concurrency-patterns/SKILL.md`
- Create: `skills/go/gin-rest-api/SKILL.md`
- Create: `skills/php/laravel-best-practices/SKILL.md`
- Create: `skills/php/symfony-fundamentals/SKILL.md`
- Create: `skills/php/php-psr-coding-standards/SKILL.md`
- Create: `skills/flutter/flutter-riverpod/SKILL.md`
- Create: `skills/flutter/flutter-go-router/SKILL.md`
- Create: `skills/flutter/flutter-testing/SKILL.md`
- Modify: `tests/e2e/smoke.test.ts`

**Interfaces:**
- Produces: `listSkills()` 返回 15 个 skill（3 原有 + 12 新增）

说明：目录用扁平结构（`skills/<skill-name>/SKILL.md`），**不**按语言分子目录。上面的 `python/`、`go/` 路径仅为清单可读性——实际路径是 `skills/fastapi-best-practices/SKILL.md` 等（与现有 `skills/vue-best-practices/` 同级）。

⚠️ **更正**：实际文件路径全部扁平，如下所示。

- [ ] **Step 1: 写失败测试**

在 `tests/e2e/smoke.test.ts` 的第一个 `it` 块（'listSkills 能读到内置 skills'，第 53-57 行）之后插入新用例。把：
```ts
  it('listSkills 能读到内置 skills', () => {
    const skills = listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(3);
    expect(skills.map(s => s.name)).toContain('vue-best-practices');
  });
```
改为：
```ts
  it('listSkills 能读到内置 skills', () => {
    const skills = listSkills();
    expect(skills.length).toBeGreaterThanOrEqual(3);
    expect(skills.map(s => s.name)).toContain('vue-best-practices');
  });

  it('listSkills 含 15 个 skill，覆盖 5 种语言', () => {
    const skills = listSkills();
    expect(skills).toHaveLength(15);
    const langs = new Set(skills.map(s => s.language));
    expect(langs).toEqual(new Set(['frontend', 'python', 'go', 'php', 'flutter']));
  });

  it('每个新语言至少有 3 个 skill', () => {
    const skills = listSkills();
    for (const lang of ['python', 'go', 'php', 'flutter'] as const) {
      const count = skills.filter(s => s.language === lang).length;
      expect(count, `${lang} 应有 3 个 skill`).toBe(3);
    }
  });
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/e2e/smoke.test.ts`
Expected: FAIL（`toHaveLength(15)` 不满足，当前只有 3 个）。

- [ ] **Step 3: 创建 12 个 SKILL.md（扁平路径）**

Python（3 个）：

`skills/fastapi-best-practices/SKILL.md`：
```yaml
---
name: fastapi-best-practices
description: FastAPI 现代 Web API 开发最佳实践，含类型注解、依赖注入与 Pydantic 校验。
category: framework
language: python
source: github.com/tiangolo/fastapi
---

# FastAPI Best Practices

本 skill 覆盖 FastAPI 路由设计、依赖注入、Pydantic 数据校验、async、OpenAPI 自动文档与项目结构。
```

`skills/python-data-science/SKILL.md`：
```yaml
---
name: python-data-science
description: pandas/NumPy 数据处理核心范式，含 DataFrame 操作、向量化与数据清洗。
category: tool
language: python
source: github.com/pandas-dev/pandas
---

# Python Data Science

本 skill 指导 pandas DataFrame 操作、NumPy 向量化计算、数据清洗与性能优化注意事项。
```

`skills/python-testing-pytest/SKILL.md`：
```yaml
---
name: python-testing-pytest
description: pytest 测试工程化最佳实践，含 fixture、参数化、conftest 与覆盖率。
category: tool
language: python
source: github.com/pytest-dev/pytest
---

# Python Testing with pytest

本 skill 覆盖 pytest fixture、参数化测试、conftest.py 组织、mock 与覆盖率配置。
```

Go（3 个）：

`skills/go-project-layout/SKILL.md`：
```yaml
---
name: go-project-layout
description: Go 项目目录结构约定，含 cmd/internal/pkg 划分与模块边界。
category: design
language: go
source: github.com/golang-standards/project-layout
---

# Go Project Layout

本 skill 指导 Go 项目目录结构：cmd/、internal/、pkg/ 划分，多 binary 组织与包边界。
```

`skills/go-concurrency-patterns/SKILL.md`：
```yaml
---
name: go-concurrency-patterns
description: Go 并发模式最佳实践，含 worker pool、fan-in/fan-out、context 取消。
category: framework
language: go
source: go.dev
---

# Go Concurrency Patterns

本 skill 覆盖 goroutine/channel 核心模式：worker pool、fan-in/fan-out、pipeline、context 取消与超时、避免泄漏。
```

`skills/gin-rest-api/SKILL.md`：
```yaml
---
name: gin-rest-api
description: Gin Web 框架开发最佳实践，含路由组、中间件、参数绑定与错误处理。
category: framework
language: go
source: github.com/gin-gonic/gin
---

# Gin REST API

本 skill 指导 Gin 路由与路由组、中间件、参数绑定/校验、错误处理与项目结构。
```

PHP（3 个）：

`skills/laravel-best-practices/SKILL.md`：
```yaml
---
name: laravel-best-practices
description: Laravel 全栈开发最佳实践，含 Eloquent ORM、路由、队列与 Artisan。
category: framework
language: php
source: github.com/laravel/laravel
---

# Laravel Best Practices

本 skill 覆盖 Laravel Eloquent ORM、路由与控制器、Blade、队列与任务、Service Provider 与测试。
```

`skills/symfony-fundamentals/SKILL.md`：
```yaml
---
name: symfony-fundamentals
description: Symfony 组件化开发基础，含 Service Container、Bundle、Doctrine 与配置环境。
category: framework
language: php
source: github.com/symfony/symfony
---

# Symfony Fundamentals

本 skill 指导 Symfony Service Container、Bundle、Doctrine、Form、Console 与可复用组件思维。
```

`skills/php-psr-coding-standards/SKILL.md`：
```yaml
---
name: php-psr-coding-standards
description: PHP-FIG 规范与 Composer 工程基础，含 PSR-1/12/4 自动加载与编码规范。
category: design
language: php
source: github.com/php-fig/fig-standards
---

# PHP PSR Coding Standards

本 skill 覆盖 PSR-1/12/4/11 编码与自动加载规范、PER-CS、Composer 依赖与 autoloader、项目布局。
```

Flutter（3 个）：

`skills/flutter-riverpod/SKILL.md`：
```yaml
---
name: flutter-riverpod
description: Riverpod 状态管理与依赖注入最佳实践，含 Provider 体系与 AsyncValue。
category: framework
language: flutter
source: github.com/rrousselGit/riverpod
---

# Flutter Riverpod

本 skill 指导 Riverpod Provider 类型体系、ref.watch/ref.listen、AsyncValue、代码生成与测试。
```

`skills/flutter-go-router/SKILL.md`：
```yaml
---
name: flutter-go-router
description: go_router 声明式导航最佳实践，含路由树、命名路由、ShellRoute 与认证守卫。
category: framework
language: flutter
source: github.com/flutter/packages
---

# Flutter go_router

本 skill 覆盖 go_router 路由树、命名路由、ShellRoute、重定向与认证守卫、深链接与 Web URL。
```

`skills/flutter-testing/SKILL.md`：
```yaml
---
name: flutter-testing
description: Flutter 测试体系最佳实践，含 unit/widget/integration 测试与 golden test。
category: tool
language: flutter
source: flutter.dev
---

# Flutter Testing

本 skill 指导 Flutter unit/widget/integration_test、Material 与 Cupertino 组件规范、golden test 与 mock。
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/e2e/smoke.test.ts`
Expected: PASS（3 个新用例 + 原有用例全过）。

- [ ] **Step 5: 提交**

```bash
git add skills/fastapi-best-practices skills/python-data-science skills/python-testing-pytest skills/go-project-layout skills/go-concurrency-patterns skills/gin-rest-api skills/laravel-best-practices skills/symfony-fundamentals skills/php-psr-coding-standards skills/flutter-riverpod skills/flutter-go-router skills/flutter-testing tests/e2e/smoke.test.ts
git commit -m "feat: add 12 skeleton skills for python/go/php/flutter"
```

---

## Task 5: UI — selectLanguage + selectSkills 过滤

**Files:**
- Modify: `src/ui/prompts.ts`
- Test: 无独立测试（clack 交互难单测；行为由 Task 7 的 add.test.ts 覆盖）

**Interfaces:**
- Consumes: `listLanguages()`、`Language`（Task 1 产出）
- Produces: `selectLanguage()` → `Promise<Language | null>`

- [ ] **Step 1: 在 `src/ui/prompts.ts` 顶部补 import**

把第 2 行：
```ts
import type { Skill, Host, HostId, Scope } from '../types.js';
```
改为：
```ts
import type { Skill, Host, HostId, Scope } from '../types.js';
import { listLanguages } from '../skills/languages.js';
import type { Language } from '../skills/languages.js';
```

- [ ] **Step 2: 在 `selectScope` 函数（第 66 行 `}`）之后插入 `selectLanguage`**

在 `src/ui/prompts.ts` 的 `selectScope` 函数之后（第 66 行后）插入：
```ts

/** 单选语言；hint 显示该语言下 skill 数量。始终列出全部 5 种。 */
export async function selectLanguage(): Promise<Language | null> {
  const langs = listLanguages();
  const ans = await p.select({
    message: '选择语言',
    options: langs.map(l => ({
      value: l.id,
      label: l.label,
      hint: l.count > 0 ? `${l.count} 个 skill` : '敬请期待',
    })),
    initialValue: 'frontend' as Language,
  });
  if (p.isCancel(ans)) return null;
  return ans as Language;
}
```

- [ ] **Step 3: 跑全量测试确认无回归**

Run: `npx vitest run`
Expected: PASS（新增的 selectLanguage 未被调用，不影响现有测试）。

- [ ] **Step 4: 提交**

```bash
git add src/ui/prompts.ts
git commit -m "feat: add selectLanguage prompt with skill count hints"
```

---

## Task 6: add 命令接线（交互 + -l flag + 校验）

**Files:**
- Modify: `src/commands/add.ts`
- Modify: `src/cli.ts:24-33`
- Test: `tests/commands/add.test.ts`（新建）

**Interfaces:**
- Consumes: `selectLanguage`（Task 5）、`isLanguage`/`Language`（Task 1）、`selectSkills`（已有）
- Produces: `AddOptions.language?: string`、`runAdd` 支持 `-l` 非交互与交互语言步骤

- [ ] **Step 1: 写失败测试 `tests/commands/add.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTmpHome } from '../helpers/tmp-home.js';

useTmpHome();

// mock clack prompts，避免真实交互
vi.mock('@clack/prompts', async () => {
  const actual: any = await vi.importActual('@clack/prompts');
  return {
    ...actual,
    select: vi.fn(async () => 'global'),
    multiselect: vi.fn(async () => []),
    confirm: vi.fn(async () => false),
    intro: vi.fn(),
    outro: vi.fn(),
    cancel: vi.fn(),
    isCancel: (v: any) => v === undefined || v === null || (typeof v === 'symbol' && v.toString() === 'Symbol(clack-cancel)'),
    log: { warn: vi.fn(), info: vi.fn(), ok: vi.fn(), fail: vi.fn(), step: vi.fn() },
  };
});

import { runAdd } from '../../src/commands/add.js';

describe('runAdd language flag', () => {
  it('非法 language 抛错', async () => {
    await expect(runAdd(['vue-best-practices'], { language: 'rust', hosts: ['zcode'] })).rejects.toThrow(/不支持的语言/);
  });

  it('-l go + 指定 skill 不属于 go 时抛错', async () => {
    await expect(runAdd(['vue-best-practices'], { language: 'go', hosts: ['zcode'] })).rejects.toThrow(/不属于 go/);
  });

  it('-l go + 合法 go skill 正常安装', async () => {
    await expect(runAdd(['go-project-layout'], { language: 'go', hosts: ['zcode'] })).resolves.toBeUndefined();
  });

  it('无 language + 指定 skill 不过滤（向后兼容）', async () => {
    await expect(runAdd(['vue-best-practices'], { hosts: ['zcode'] })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/commands/add.test.ts`
Expected: FAIL（`AddOptions` 还没 `language` 字段；`runAdd` 没有校验逻辑）。

- [ ] **Step 3: 改 `src/commands/add.ts`**

替换整个文件内容为：
```ts
import { listSkills } from '../skills/registry.js';
import { installSkill } from '../skills/installer.js';
import { recordSkillInstall } from '../skills/manifest.js';
import { getAvailableHosts, allHosts } from '../hosts/index.js';
import { selectHosts, selectSkills, selectScope, selectLanguage, intro, outro, cancel } from '../ui/prompts.js';
import { log } from '../utils/logger.js';
import { isLanguage } from '../skills/languages.js';
import type { HostId, Scope } from '../types.js';

export interface AddOptions {
  hosts?: HostId[];      // 非交互指定
  force?: boolean;
  scope?: Scope;         // 默认 'global'
  cwd?: string;          // project 时的目标项目路径
  language?: string;     // 按语言过滤（frontend/python/go/php/flutter）
}

export async function runAdd(names: string[], opts: AddOptions = {}): Promise<void> {
  let skillNames = names;
  let hostIds = opts.hosts;
  let scope = opts.scope;
  let language = opts.language;

  // 非交互校验：language 若指定必须合法
  if (language !== undefined && !isLanguage(language)) {
    throw new Error(`不支持的语言：${language}（合法值：frontend, python, go, php, flutter）`);
  }

  // 非交互校验：skills 已指定 + language 已指定时，每个 skill 必须属于该语言
  // （无论是否交互都校验，保证 -l go vue-best-practices -H zcode 也报错）
  if (language && skillNames.length > 0) {
    const valid = new Set(listSkills().filter(s => s.language === language).map(s => s.name));
    for (const n of skillNames) {
      if (!valid.has(n)) {
        throw new Error(`${n} 不属于 ${language}（language 校验失败）`);
      }
    }
  }

  // 交互模式：未指定 names 或 hosts 或 scope
  const interactive = skillNames.length === 0 || !hostIds || !scope;
  if (interactive) {
    intro();
    if (!scope) {
      const s = await selectScope();
      if (s === null) return cancel('已取消');
      scope = s;
    }
    // 语言步骤：未指定 language 时交互询问
    if (!language) {
      const l = await selectLanguage();
      if (l === null) return cancel('已取消');
      language = l;
    }
    if (skillNames.length === 0) {
      // 按语言过滤
      const filtered = listSkills().filter(s => s.language === language);
      if (filtered.length === 0) {
        return cancel(`该语言（${language}）暂无 skills，敬请期待`);
      }
      const selected = await selectSkills(filtered);
      if (selected === null) return cancel('已取消');
      skillNames = selected;
    }
    if (!hostIds) {
      const available = getAvailableHosts();
      const pool = available.length > 0 ? available : allHosts;
      const defaultIds = available.map(h => h.id);
      const selected = await selectHosts(pool, defaultIds);
      if (selected === null) return cancel('已取消');
      hostIds = selected;
    }
  }

  if (skillNames.length === 0) {
    log.info('未选择任何 skill');
    if (interactive) outro('完成');
    return;
  }

  const scopeTag = scope === 'project' ? '[project] ' : '';
  for (const name of skillNames) {
    try {
      const results = installSkill(name, hostIds!, { force: opts.force, scope, cwd: opts.cwd });
      for (const r of results) {
        const hostLabel = r.hostId;
        if (r.outcome === 'installed') log.ok(`${scopeTag}${name} → ${hostLabel} 已安装`);
        else if (r.outcome === 'skipped-same') log.info(`${scopeTag}${name} → ${hostLabel} 已是最新`);
        else if (r.outcome === 'skipped-modified') log.warn(`${scopeTag}${name} → ${hostLabel} 已被修改，跳过（--force 覆盖）`);
        else if (r.outcome === 'overwritten') log.ok(`${scopeTag}${name} → ${hostLabel} 已覆盖（备份: ${r.backupPath}）`);
      }
      recordSkillInstall(name, hostIds!, { scope, cwd: opts.cwd });
    } catch (e: any) {
      log.fail(`${name}: ${e?.message || e}`);
    }
  }
  const tail = scope === 'project'
    ? '完成。skills 已装入当前项目目录，可随项目 commit。'
    : '完成。重启对应宿主以加载新 skills。';
  if (interactive) outro(tail);
}
```

- [ ] **Step 4: 改 `src/cli.ts` 的 add 命令，加 `-l/--language`**

把 `src/cli.ts:24-33`：
```ts
program
  .command('add [skills...]')
  .description('安装指定 skill（省略则交互选择）')
  .option('-H, --hosts <ids>', '目标宿主，逗号分隔（zcode,claude,codex,cursor,trae）')
  .option('-f, --force', '覆盖已修改的 skill')
  .option('-p, --project', '装入当前项目目录（默认装到全局 ~/.xxx/skills）')
  .action(async (skills: string[], opts: { hosts?: string; force?: boolean; project?: boolean }) => {
    const hostIds = opts.hosts ? opts.hosts.split(',').map(s => s.trim()) as HostId[] : undefined;
    await runAdd(skills, { hosts: hostIds, force: opts.force, scope: opts.project ? 'project' : 'global' });
  });
```
改为：
```ts
program
  .command('add [skills...]')
  .description('安装指定 skill（省略则交互选择）')
  .option('-H, --hosts <ids>', '目标宿主，逗号分隔（zcode,claude,codex,cursor,trae）')
  .option('-f, --force', '覆盖已修改的 skill')
  .option('-p, --project', '装入当前项目目录（默认装到全局 ~/.xxx/skills）')
  .option('-l, --language <lang>', '按语言过滤（frontend,python,go,php,flutter）')
  .action(async (skills: string[], opts: { hosts?: string; force?: boolean; project?: boolean; language?: string }) => {
    const hostIds = opts.hosts ? opts.hosts.split(',').map(s => s.trim()) as HostId[] : undefined;
    await runAdd(skills, { hosts: hostIds, force: opts.force, scope: opts.project ? 'project' : 'global', language: opts.language });
  });
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/commands/add.test.ts`
Expected: PASS（4 个用例全过）。

- [ ] **Step 6: 全量回归**

Run: `npx vitest run`
Expected: PASS（所有测试全过）。

- [ ] **Step 7: 提交**

```bash
git add src/commands/add.ts src/cli.ts tests/commands/add.test.ts
git commit -m "feat: add language filter step and -l/--language flag to add command"
```

---

## Task 7: wizard 接线语言步骤

**Files:**
- Modify: `src/commands/wizard.ts`

**Interfaces:**
- Consumes: `selectLanguage`（Task 5）

- [ ] **Step 1: 改 `src/commands/wizard.ts`**

把第 6 行 import：
```ts
import { selectSkills, selectHosts, selectScope, confirmCodegraph, confirmInitProject, intro, outro, cancel } from '../ui/prompts.js';
```
改为：
```ts
import { selectSkills, selectHosts, selectScope, selectLanguage, confirmCodegraph, confirmInitProject, intro, outro, cancel } from '../ui/prompts.js';
```

把第 8 行 import 后追加 Language 类型（在 `import type { HostId, Scope } from '../types.js';` 之后加一行）：
```ts
import type { HostId, Scope } from '../types.js';
```
（保持不变，无需新增类型 import——`selectLanguage` 返回的是 string 字面量联合，直接用即可）

把第 13-20 行：
```ts
  // 0. 安装作用域
  const scope: Scope | null = await selectScope();
  if (scope === null) return cancel('已取消');

  // 1. skills 选择
  const skills = listSkills();
  const selectedSkills = await selectSkills(skills);
  if (selectedSkills === null) return cancel('已取消');
```
改为：
```ts
  // 0. 安装作用域
  const scope: Scope | null = await selectScope();
  if (scope === null) return cancel('已取消');

  // 0.5 选择语言
  const language = await selectLanguage();
  if (language === null) return cancel('已取消');

  // 1. skills 选择（按语言过滤）
  const skills = listSkills().filter(s => s.language === language);
  if (skills.length === 0) return cancel(`该语言（${language}）暂无 skills，敬请期待`);
  const selectedSkills = await selectSkills(skills);
  if (selectedSkills === null) return cancel('已取消');
```

- [ ] **Step 2: 跑全量测试确认无回归**

Run: `npx vitest run`
Expected: PASS（wizard 无独立单测，由 e2e 覆盖；确保不破坏其他测试）。

- [ ] **Step 3: 提交**

```bash
git add src/commands/wizard.ts
git commit -m "feat: insert language selection step into wizard flow"
```

---

## Task 8: list 命令加语言标签

**Files:**
- Modify: `src/commands/list.ts`

**Interfaces:**
- Consumes: `Skill.language`（已有）

- [ ] **Step 1: 改 `src/commands/list.ts` 的输出格式**

把第 21-33 行的分组输出：
```ts
  // 按 category 分组
  const byCat = new Map<string, typeof skills>();
  for (const s of skills) {
    if (!byCat.has(s.category)) byCat.set(s.category, []);
    byCat.get(s.category)!.push(s);
  }
  for (const [cat, items] of byCat) {
    console.log(`\n[${cat}]`);
    for (const s of items) {
      console.log(`  ${s.name}${installMark(s.name)}`);
      if (s.description) console.log(`    ${s.description}`);
    }
  }
```
改为（按 language 分组，每组标题带中文标签）：
```ts
  // 按 language 分组（语言 > category 双维度）
  const LANG_LABELS: Record<string, string> = {
    frontend: '前端', python: 'Python', go: 'Go', php: 'PHP', flutter: 'Flutter',
  };
  const byLang = new Map<string, typeof skills>();
  for (const s of skills) {
    const key = s.language || 'other';
    if (!byLang.has(key)) byLang.set(key, []);
    byLang.get(key)!.push(s);
  }
  // 固定语言顺序
  const order = ['frontend', 'python', 'go', 'php', 'flutter', 'other'];
  for (const lang of order) {
    const items = byLang.get(lang);
    if (!items || items.length === 0) continue;
    const label = LANG_LABELS[lang] || lang;
    console.log(`\n[${label}]`);
    for (const s of items) {
      console.log(`  ${s.name} (${s.category})${installMark(s.name)}`);
      if (s.description) console.log(`    ${s.description}`);
    }
  }
```

- [ ] **Step 2: 跑全量测试确认无回归**

Run: `npx vitest run`
Expected: PASS。

- [ ] **Step 3: 手动验证 list 输出**

Run: `npx tsx src/cli.ts list`
Expected: 输出按语言分组，5 种语言各显示对应 skills，每个 skill 后跟 `(category)` 标签和安装标记。

- [ ] **Step 4: 提交**

```bash
git add src/commands/list.ts
git commit -m "feat: group list output by language with category tags"
```

---

## Task 9: 端到端验证 + 手动验证清单

**Files:**
- Modify: `tests/e2e/smoke.test.ts`

**Interfaces:**
- Consumes: 全部前序任务产出

- [ ] **Step 1: 在 e2e 测试补新 skill 的 project 安装用例**

在 `tests/e2e/smoke.test.ts` 的 'project scope 装入当前项目目录而非家目录' 用例（第 66-73 行）之后插入：
```ts

  it('新语言 skill（go-project-layout）project 安装正常', () => {
    const projectCwd = mkdtempSync(join(tmpdir(), 'rdcfg-e2e-go-'));
    const results = installSkill('go-project-layout', ['zcode'], { scope: 'project', cwd: projectCwd });
    expect(results.every(r => r.outcome === 'installed')).toBe(true);
    expect(existsSync(join(projectCwd, '.zcode', 'skills', 'go-project-layout', 'SKILL.md'))).toBe(true);
  });
```

- [ ] **Step 2: 跑 e2e 测试确认通过**

Run: `npx vitest run tests/e2e/smoke.test.ts`
Expected: PASS（全部用例含新增 4 个）。

- [ ] **Step 3: 跑全量测试**

Run: `npx vitest run`
Expected: 全绿。

- [ ] **Step 4: 手动验证清单（逐条执行）**

```bash
# 1. list 显示 15 个 skill，按语言分组
npx tsx src/cli.ts list

# 2. 非交互安装指定语言 skill
npx tsx src/cli.ts add -l go go-project-layout -H zcode

# 3. 非法语言报错
npx tsx src/cli.ts add -l rust foo -H zcode
# Expected: 报错列出合法语言

# 4. skill 不属于该语言报错
npx tsx src/cli.ts add -l go vue-best-practices -H zcode
# Expected: 报错 "vue-best-practices 不属于 go"

# 5. 构建
npm run build
# Expected: tsup 成功，dist/ 生成
```

- [ ] **Step 5: 提交**

```bash
git add tests/e2e/smoke.test.ts
git commit -m "test: add e2e for new language skill project install"
```

- [ ] **Step 6: 最终全量回归 + 构建**

Run: `npm run test && npm run build`
Expected: 测试全绿 + 构建成功。

---

## 完成标准

- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] `rdcfg list` 显示 5 种语言分组、15 个 skill
- [ ] `rdcfg add -l <lang>` 非交互过滤正常
- [ ] 非法语言 / skill 不属于该语言 报错清晰
- [ ] `rdcfg wizard` 交互流程含语言步骤
