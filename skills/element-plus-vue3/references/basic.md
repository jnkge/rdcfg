# 基础组件参考（Basic）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## Layout 栅格布局

基于 24 分栏的弹性栅格系统。

```vue
<el-row :gutter="20" type="flex" justify="center" align="middle">
  <el-col :span="6"><div>1/4</div></el-col>
  <el-col :span="6"><div>1/4</div></el-col>
  <el-col :span="6"><div>1/4</div></el-col>
  <el-col :span="6"><div>1/4</div></el-col>
</el-row>
```

### Row Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `gutter` | 栅格间距(px) | number | 0 |
| `type` | `flex` 启用 flex 布局 | string | — |
| `justify` | flex 水平排列 `start/end/center/space-around/space-between` | string | start |
| `align` | flex 垂直排列 `top/middle/bottom` | string | — |
| `tag` | 自定义元素标签 | string | div |

### Col Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `span` | 栅格占据的列数(0-24) | number | 24 |
| `offset` | 栅格左侧间隔列数 | number | 0 |
| `push` | 栅格右移列数 | number | 0 |
| `pull` | 栅格左移列数 | number | 0 |
| `xs` / `sm` / `md` / `lg` / `xl` | 响应式断点 `<768px` / `≥768px` / `≥992px` / `≥1200px` / `≥1920px` | number/object | — |

### 响应式写法

```vue
<el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
  <!-- 响应式宽度 -->
</el-col>
<!-- 或对象写法 -->
<el-col :xs="{ span: 24, offset: 0 }" :sm="{ span: 12, offset: 2 }">
</el-col>
```

---

## Container 布局容器

用于页面整体布局的容器组件。

```vue
<el-container>
  <el-aside width="200px">侧边栏</el-aside>
  <el-container>
    <el-header>头部</el-header>
    <el-main>主内容</el-main>
    <el-footer>底部</el-footer>
  </el-container>
</el-container>
```

### 组件嵌套规则

- `<el-container>`：外层容器。子元素含 `<el-aside>` 时水平排列，否则垂直排列。
- `<el-header>`：顶栏容器，默认高度 60px。
- `<el-aside>`：侧边栏容器，默认宽度 300px。
- `<el-main>`：主要区域容器。
- `<el-footer>`：底栏容器，默认高度 60px。

### Container 子组件 Props

| 组件 | Prop | 说明 | 类型 | 默认值 |
|------|------|------|------|--------|
| Header | `height` | 顶栏高度 | string | 60px |
| Aside | `width` | 侧边栏宽度 | string | 300px |
| Footer | `height` | 底栏高度 | string | 60px |

---

## Button 按钮

```vue
<el-button type="primary" size="default" :loading="loading" @click="handleClick">
  主要按钮
</el-button>
<el-button type="text">文字按钮</el-button>          <!-- Element UI -->
<el-button type="primary" link>链接按钮</el-button>   <!-- Element Plus -->
<el-button-group>
  <el-button type="primary" icon="el-icon-arrow-left">上一页</el-button>
  <el-button type="primary">下一页<i class="el-icon-arrow-right el-icon--right"></i></el-button>
</el-button-group>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `type` | 类型 | string | `primary/success/warning/danger/info/text`(UI) / 增加 `default`(Plus) | default |
| `size` | 尺寸 | string | UI: `medium/small/mini` / Plus: `large/default/small` | — |
| `plain` | 朴素按钮 | boolean | — | false |
| `round` | 圆角按钮 | boolean | — | false |
| `circle` | 圆形按钮 | boolean | — | false |
| `loading` | 加载中 | boolean | — | false |
| `disabled` | 禁用 | boolean | — | false |
| `icon` | 图标类名(UI)/组件(Plus) | string/component | — | — |
| `native-type` | 原生 type 属性 | string | `button/submit/reset` | button |

### 版本差异

| 特性 | Element UI | Element Plus |
|------|-----------|-------------|
| 文字按钮 | `type="text"` | `type="primary" link` 或 `<el-text>` |
| 图标 | `icon="el-icon-edit"` (class) | `icon="Edit"` (组件名) 或 `<el-icon><Edit /></el-icon>` |
| 自动插入间距 | `el-icon--right` / `el-icon--left` class | 自动处理图标间距 |

---

## Icon 图标

### Element UI (Vue 2)

```vue
<i class="el-icon-edit"></i>
<i class="el-icon-share"></i>
<i class="el-icon-delete"></i>
<!-- 按钮内 -->
<el-button type="primary" icon="el-icon-search">搜索</el-button>
```

### Element Plus (Vue 3)

```vue
<!-- 需安装 @element-plus/icons-vue -->
<script setup>
import { Edit, Delete, Search } from '@element-plus/icons-vue'
</script>

<template>
  <!-- 方式1：直接使用图标组件 -->
  <Edit />
  <!-- 方式2：配合 el-icon 容器 -->
  <el-icon :size="20" color="#409EFF"><Search /></el-icon>
  <!-- 方式3：在按钮中使用 -->
  <el-button type="primary" :icon="Search">搜索</el-button>
</template>
```

### el-icon Props (Plus only)

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `size` | 图标尺寸(px) | number/string | 继承字体大小 |
| `color` | 图标颜色 | string | 继承颜色 |

---

## Link 链接

```vue
<el-link type="primary" href="https://example.com" target="_blank" :underline="false">
  主要链接
</el-link>
<el-link type="primary" :icon="Edit">编辑</el-link>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `type` | 类型 | string | `primary/success/warning/danger/info/default` | default |
| `underline` | 下划线 | boolean | — | true |
| `disabled` | 禁用 | boolean | — | false |
| `href` | 原生 href | string | — | — |
| `target` | 原生 target | string | — | — |
| `icon` | 图标 | string/component | — | — |

---

## Space 间距 (Element Plus only)

```vue
<el-space :size="16" direction="horizontal" :wrap="true">
  <el-button>按钮1</el-button>
  <el-button>按钮2</el-button>
  <el-button>按钮3</el-button>
</el-space>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `direction` | 排列方向 `horizontal/vertical` | string | horizontal |
| `size` | 间距大小 `small/default/large` 或具体数值 | string/number/array | small |
| `wrap` | 是否自动换行 | boolean | false |
| `fill` | 是否让子元素填满容器 | boolean | false |
| `alignment` | 对齐方式 | string | center |
| `spacer` | 间隔符(可以是 VNode) | string/VNode | — |

---

## Scrollbar 滚动条 (Element Plus only)

```vue
<el-scrollbar height="400px">
  <p v-for="i in 100" :key="i">{{ i }}</p>
</el-scrollbar>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `height` | 高度 | string/number | — |
| `max-height` | 最大高度 | string/number | — |
| `native` | 使用原生滚动条 | boolean | false |
| `wrap-style` | 包裹层样式 | string/object | — |
| `wrap-class` | 包裹层类名 | string | — |
| `view-style` | 视图层样式 | string/object | — |
| `always` | 滚动条始终显示 | boolean | false |
| `min-size` | 滚动条最小尺寸 | number | 20 |

---

## Typography 排版 & Text 文本 (Element Plus only)

```vue
<el-text>默认文本</el-text>
<el-text type="primary">主要文本</el-text>
<el-text type="success" size="large">大号成功文本</el-text>
<el-text tag="b" truncated>超长文本会被截断显示省略号...</el-text>

<!-- 标题 -->
<el-h1>一级标题</el-h1>  <!-- 实际使用 el-text tag="h1" -->
<el-text tag="h1" size="large">标题</el-text>
```

### Text Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `type` | 类型 | string | `primary/success/warning/danger/info` | — |
| `size` | 尺寸 | string | `large/default/small` | default |
| `tag` | 自定义标签 | string | — | span |
| `truncated` | 截断显示省略号 | boolean | — | false |
| `line-clamp` | 多行截断行数 | string/number | — | — |
