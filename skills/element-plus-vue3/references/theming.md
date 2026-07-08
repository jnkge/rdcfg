# 主题定制参考（Theming）

> Element UI (Vue 2) 和 Element Plus (Vue 3) 主题定制方式有显著差异

## Element UI (Vue 2) — SCSS 变量覆盖

### 方式一：项目内 SCSS 覆盖（推荐）

```scss
// src/styles/element-variables.scss

/* ========== 主题色 ========== */
$--color-primary: #409EFF;
$--color-success: #67C23A;
$--color-warning: #E6A23C;
$--color-danger: #F56C6C;
$--color-info: #909399;

/* ========== 字体 ========== */
$--font-size-base: 14px;
$--font-size-small: 13px;
$--font-size-large: 16px;

/* ========== 边框 ========== */
$--border-color-base: #DCDFE6;
$--border-radius-base: 4px;

/* ========== 需要指定字体路径 ========== */
$--font-path: '~element-ui/lib/theme-chalk/fonts';

/* ========== 导入全部样式 ========== */
@import "~element-ui/packages/theme-chalk/src/index";
```

```js
// main.js — 用 SCSS 文件替代默认 CSS
// import 'element-ui/lib/theme-chalk/index.css'  ← 删除这行
import './styles/element-variables.scss'
```

### 方式二：主题生成工具

```bash
npm install element-theme -g
npm install element-theme-chalk -D

# 生成变量文件
et -i element-variables.scss

# 编辑 element-variables.scss 后编译
et

# 编译后产出在 ./theme/ 目录
```

在项目中使用：
```js
import '../theme/index.css'
```

### 关键 SCSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `$--color-primary` | `#409EFF` | 主色 |
| `$--color-success` | `#67C23A` | 成功色 |
| `$--color-warning` | `#E6A23C` | 警告色 |
| `$--color-danger` | `#F56C6C` | 危险色 |
| `$--color-info` | `#909399` | 信息色 |
| `$--color-text-primary` | `#303133` | 主要文字 |
| `$--color-text-regular` | `#606266` | 常规文字 |
| `$--color-text-secondary` | `#909399` | 次要文字 |
| `$--color-text-placeholder` | `#C0C4CC` | 占位文字 |
| `$--border-color-base` | `#DCDFE6` | 边框色 |
| `$--border-radius-base` | `4px` | 圆角 |
| `$--font-size-base` | `14px` | 基础字号 |
| `$--font-path` | — | 字体文件路径(必填) |
| `$--background-color-base` | `#F5F7FA` | 基础背景色 |

---

## Element Plus (Vue 3) — CSS 变量覆盖

### 方式一：CSS 变量覆盖（最简单）

```css
/* 在全局 CSS 中覆盖 */
:root {
  --el-color-primary: #409EFF;
  --el-color-success: #67C23A;
  --el-color-warning: #E6A23C;
  --el-color-danger: #F56C6C;
  --el-color-info: #909399;

  --el-font-size-base: 14px;
  --el-border-radius-base: 4px;
  --el-border-color: #DCDFE6;
}
```

### 方式二：SCSS 变量覆盖

```scss
// styles/element/index.scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #409EFF,
    ),
    'success': (
      'base': #67C23A,
    ),
    'warning': (
      'base': #E6A23C,
    ),
    'danger': (
      'base': #F56C6C,
    ),
  ),
  $font-size: (
    'base': 14px,
  ),
  $border-radius: (
    'base': 4px,
  )
);

@use "element-plus/theme-chalk/src/index" as *;
```

```js
// main.js
// import 'element-plus/dist/index.css'  ← 删除这行
import './styles/element/index.scss'
```

### 方式三：命名空间自定义

```vue
<el-config-provider namespace="ep">
  <App />
</el-config-provider>
```

```scss
// 需要在 SCSS 中也修改命名空间
@forward 'element-plus/theme-chalk/src/mixins/config.scss' with (
  $namespace: 'ep'
);
```

### 关键 CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--el-color-primary` | `#409EFF` | 主色 |
| `--el-color-primary-light-3` | 自动生成 | 主色浅色变体 |
| `--el-color-primary-light-5` | 自动生成 | 主色更浅变体 |
| `--el-color-primary-light-7` | 自动生成 | 主色极浅变体 |
| `--el-color-primary-light-8` | 自动生成 | 主色极浅变体 |
| `--el-color-primary-light-9` | 自动生成 | 主色最浅变体 |
| `--el-color-primary-dark-2` | 自动生成 | 主色深色变体 |
| `--el-color-success` | `#67C23A` | 成功色 |
| `--el-color-warning` | `#E6A23C` | 警告色 |
| `--el-color-danger` | `#F56C6C` | 危险色 |
| `--el-color-info` | `#909399` | 信息色 |
| `--el-text-color-primary` | `#303133` | 主要文字色 |
| `--el-text-color-regular` | `#606266` | 常规文字色 |
| `--el-border-color` | `#DCDFE6` | 边框色 |
| `--el-border-radius-base` | `4px` | 圆角 |
| `--el-font-size-base` | `14px` | 基础字号 |
| `--el-bg-color` | `#FFFFFF` | 背景色 |
| `--el-bg-color-page` | `#F2F3F5` | 页面背景色 |
| `--el-fill-color-blank` | `#FFFFFF` | 填充空白色 |

---

## 暗色模式 (Element Plus only)

Element Plus 原生支持暗色模式。

### 方式一：HTML class 切换

```html
<html class="dark">
```

```js
// 切换暗色模式
document.documentElement.classList.toggle('dark')
```

需引入暗色 CSS：
```js
import 'element-plus/theme-chalk/dark/css-vars.css'
```

### 方式二：CSS 变量覆盖暗色

```css
html.dark {
  --el-color-primary: #409EFF;
  --el-bg-color: #141414;
  --el-bg-color-page: #0a0a0a;
  --el-text-color-primary: #E5EAF3;
  --el-border-color: #4C4D4F;
  /* 更多变量... */
}
```

### 方式三：useDark 组合式（配合 VueUse）

```js
import { useDark, useToggle } from '@vueuse/core'
const isDark = useDark()
const toggleDark = useToggle(isDark)
```

---

## 动态主题切换

### Element UI（运行时）

Element UI 不原生支持运行时主题切换。需要：

1. 编译多套主题 CSS
2. 动态切换 `<link>` 标签的 `href`

```js
function toggleTheme(theme) {
  const link = document.getElementById('theme-link')
  link.href = `/themes/${theme}/index.css`
}
```

### Element Plus（运行时）

Element Plus 基于 CSS 变量，可以直接运行时修改：

```js
function setPrimaryColor(color) {
  document.documentElement.style.setProperty('--el-color-primary', color)
  // 自动生成浅色变体（Element Plus 内部不自动生成，需手动设置）
  document.documentElement.style.setProperty('--el-color-primary-light-3', lighten(color, 0.3))
  document.documentElement.style.setProperty('--el-color-primary-light-5', lighten(color, 0.5))
  document.documentElement.style.setProperty('--el-color-primary-light-7', lighten(color, 0.7))
  document.documentElement.style.setProperty('--el-color-primary-light-8', lighten(color, 0.8))
  document.documentElement.style.setProperty('--el-color-primary-light-9', lighten(color, 0.9))
  document.documentElement.style.setProperty('--el-color-primary-dark-2', darken(color, 0.2))
}
```

或使用 Element Plus 提供的工具：

```js
import { useColorMode } from '@element-plus/hooks'
```
