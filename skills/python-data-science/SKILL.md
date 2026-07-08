---
name: python-data-science
description: pandas/NumPy 数据处理核心范式，含 DataFrame 操作、向量化与数据清洗。
category: tool
language: python
source: github.com/sanjeed5/awesome-cursor-rules-mdc
---

# pandas / NumPy 数据处理最佳实践

本 skill 面向表格数据（pandas）与多维数组（NumPy）的处理，覆盖代码组织、常用模式与反模式、向量化与内存性能、数据安全、测试与常见陷阱。两条主线：pandas 用 DataFrame/Series 表达结构化数据、NumPy 用 ndarray 表达数值数组；二者共享"向量化优先、显式拷贝、控制 dtype"的核心理念。完整英文细则见 references。

## 核心要点

### pandas
- **结构清晰**：`data/raw`、`data/processed`、`src/modules`、`tests` 分层；模块遵循单一职责，函数化拆解大操作并支持方法链。
- **向量化优先**：用 `apply`/`map`/`groupby`/`pivot_table`/`agg`/`transform` 替代 `iterrows()` 与手写循环。
- **索引与类型**：正确设置 index 提升 join/merge 性能；用 `.loc`/`.iloc` 取代链式索引（`df['A']['B']`）；用 `astype()` 显式控制 dtype，必要时用 categorical 降内存。
- **数据清洗**：`dropna`/`fillna`/`replace` 处理缺失值；用 `.copy()` 避免原地修改副作用。
- **性能与内存**：优先 Parquet/Feather 存储与列式格式；大数据用分块（chunking）或 Dask；必要时 Numba/Cython 加速。

### NumPy
- **向量化与广播**：用 ufunc（`np.sin`/`np.exp`/`np.add`）和广播规则替代显式循环；理解 shape 对齐避免静默错误。
- **视图 vs 拷贝**：切片可能返回 view，修改会影响原数组；明确区分 `view`/`copy`，必要时显式拷贝。
- **dtype 与内存**：选最小够用的 dtype（`np.int8`/`float32`），用 `np.empty`/`np.memmap`/`del` 控制内存。
- **数值健壮性**：用 `np.errstate`/`np.seterr` 处理浮点异常；用 `np.testing.assert_allclose` 比较浮点。
- **安全输入**：避免对不可信数据用 `np.fromstring`/`frombuffer`；用 `np.asarray` 规范化外部输入。

## 参考指南

| 主题 | 参考文件 | 何时查阅 |
|------|---------|---------|
| pandas 表格数据处理 | `references/pandas-numpy.md`（Part I） | 目录约定、方法链/Factory/Strategy 模式、反模式（链式索引、iterrows）、向量化与内存优化、安全（SQL/CSV 注入、`eval`）、测试与调试 |
| NumPy 数组计算 | `references/pandas-numpy.md`（Part II） | 目录与命名、Strategy/Factory/Observer、向量化与广播、视图/拷贝、dtype 与 `np.einsum`、Numba/Cython/BLAS、安全与输入校验、陷阱（0 基索引、NaN/Inf） |

`references/pandas-numpy.md` 是两份指南的合并：Part I 为 pandas（7 节），Part II 为 NumPy（7 节），结构对齐（代码组织 / 模式与反模式 / 性能 / 安全 / 测试 / 陷阱 / 工具链），便于按场景检索。

## 约束

### 必做
- 用向量化操作替代逐元素循环；pandas 用 `groupby`/`transform`/`apply`，NumPy 用 ufunc 与广播。
- 显式管理 dtype 与 index：选最小够用类型、join 前设好 index。
- pandas 取值用 `.loc`/`.iloc`；NumPy 切片后若需独立修改，显式 `.copy()`。
- 处理缺失值、空数组、重复索引、NaN/Inf 等 edge case。
- 读外部数据用参数化查询/`np.asarray`，并对类型、shape、范围做校验。
- 浮点比较用 `np.testing.assert_allclose`，勿用 `==`。

### 禁止
- pandas 用 `iterrows()`/`itertuples()` 或手写循环处理逐行逻辑。
- 用链式索引（`df['A']['B']`）或原地修改 DataFrame 而不拷贝。
- NumPy 在元素级操作中写显式循环、盲目 hardcode 数组 shape。
- 对不可信输入用 `eval()`/`exec()`/`np.fromstring`/`frombuffer`。
- 用可变对象做函数默认参数；忽视 dtype 导致整数溢出或静默类型提升。
