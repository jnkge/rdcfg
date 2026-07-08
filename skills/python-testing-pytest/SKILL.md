---
name: python-testing-pytest
description: pytest 测试工程化最佳实践，含 fixture、参数化、conftest 与覆盖率。
category: tool
language: python
source: github.com/sanjeed5/awesome-cursor-rules-mdc
---

# pytest 测试工程化最佳实践

本 skill 面向 Python 项目的测试工程化，覆盖项目结构、fixture 与参数化、conftest 组织、mock 与覆盖率、CI/CD 集成。核心思想：测试保持无状态与独立性、行为优先而非实现细节、用 fixture 复用与隔离、用参数化压减重复用例、用并行与覆盖率加速与度量。完整英文细则见 references。

## 核心要点

- **结构**：测试放独立 `tests/` 目录，文件用 `test_*.py`；推荐 `src` layout 避免导入冲突；测试模块镜像应用结构。
- **AAA 模式**：每个测试分 Arrange / Act / Assert 三段，单一断言聚焦失败点。
- **fixture 驱动**：用 `@pytest.fixture` 管理 setup/teardown，按 `session`/`module`/`function` 控制生命周期；用 fixture factory 造可复用测试数据。
- **参数化**：`@pytest.mark.parametrize` 用同一套逻辑覆盖多组输入与边界值，减少重复代码。
- **异常测试**：用 `pytest.raises` 断言异常并校验错误信息。
- **mock 隔离**：用 `pytest-mock` 的 `mocker` fixture 打桩外部依赖，`autospec=True` 保证 mock 与原对象 API 一致。
- **性能与覆盖率**：`pytest-xdist` 并行（`pytest -n auto`）、`--durations` 定位慢测试、`pytest-cov` + `--cov-report` 度量覆盖；配置集中在 `pyproject.toml`。
- **质量**：`flake8-pytest-style` 统一 pytest 写法、`black` 格式化、GitHub Actions 等 CI 自动运行。

## 参考指南

| 主题 | 参考文件 | 何时查阅 |
|------|---------|---------|
| pytest 全部最佳实践 | `references/pytest.md` | 目录结构与 src layout、AAA/fixture factory 模式、反模式、状态管理、异常测试、性能与并行、安全、mock（mocker + autospec）、陷阱、pyproject 配置与 CI 示例 |

`references/pytest.md` 内含 7 大节：代码组织与结构、模式与反模式、性能、安全、测试方法（单测/集成/E2E）、常见陷阱、工具链与环境（含 `pyproject.toml` 与 GitHub Actions 完整示例）。遇到具体问题（fixture scope、参数化、慢测试、覆盖率配置、CI workflow）可直接检索对应小节。

## 约束

### 必做
- 测试保持无状态、彼此独立，每个测试自备数据并自行清理。
- 遵循 AAA 结构，优先单一断言，命名清晰描述被测行为。
- 用 fixture 管理 setup/teardown，按需选择最小作用域（session/module/function）。
- 用 `@pytest.mark.parametrize` 覆盖正常值、边界值与非法输入。
- 测异常用 `pytest.raises`；mock 外部依赖用 `mocker` 并加 `autospec=True`。
- 在 `pyproject.toml` 集中配置 `addopts`、`testpaths` 与覆盖率。
- 把 pytest 纳入 CI，每次提交自动跑测试与覆盖率。

### 禁止
- 测试间共享状态或存在隐式依赖（破坏隔离、难以定位失败）。
- 过度依赖 fixture（简单不复用的数据应直接在测试里构造）。
- 测试实现细节而非行为（重构即脆）。
- 无理由地 `pytest.skip`，或忽略 pytest 警告。
- 在测试里硬编码环境特定路径/密钥；忘记清理临时文件与数据库连接。
