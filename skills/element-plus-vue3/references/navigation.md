# 导航组件参考（Navigation）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## NavMenu 导航菜单

### 侧边栏（最常用模式）

```vue
<template>
  <el-menu
    :default-active="activeIndex"
    :collapse="isCollapse"
    :router="true"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
    @select="handleSelect"
  >
    <el-sub-menu index="1">
      <template #title>
        <el-icon><Location /></el-icon>
        <span>导航一</span>
      </template>
      <el-menu-item index="/dashboard">首页</el-menu-item>
      <el-menu-item index="/users">用户管理</el-menu-item>
    </el-sub-menu>
    <el-menu-item index="/settings">
      <el-icon><Setting /></el-icon>
      <span>设置</span>
    </el-menu-item>
  </el-menu>
</template>
```

> **版本差异**：Element UI 使用 `<el-submenu>`，Element Plus 使用 `<el-sub-menu>`。

### 顶部模式

```vue
<el-menu mode="horizontal" :default-active="activeIndex" @select="handleSelect"
  background-color="#545c64" text-color="#fff" active-text-color="#ffd04b">
  <el-menu-item index="1">处理中心</el-menu-item>
  <el-sub-menu index="2">
    <template #title>我的工作台</template>
    <el-menu-item index="2-1">选项1</el-menu-item>
    <el-menu-item index="2-2">选项2</el-menu-item>
    <el-sub-menu index="2-3">
      <template #title>选项3</template>
      <el-menu-item index="2-3-1">选项3-1</el-menu-item>
    </el-sub-menu>
  </el-sub-menu>
  <el-menu-item index="3" disabled>消息中心</el-menu-item>
</el-menu>
```

### Menu Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `mode` | 模式 | string | `horizontal/vertical` | vertical |
| `collapse` | 折叠(侧边栏) | boolean | — | false |
| `background-color` | 背景色 | string | — | #ffffff |
| `text-color` | 文字颜色 | string | — | #303133 |
| `active-text-color` | 激活文字颜色 | string | — | #409EFF |
| `default-active` | 当前激活菜单 index | string | — | — |
| `default-openeds` | 默认展开的 sub-menu | array | — | — |
| `unique-opened` | 只展开一个 sub-menu | boolean | — | false |
| `router` | 使用 vue-router 模式 | boolean | — | false |
| `collapse-transition` | 折叠动画 | boolean | — | true |

### Menu Events

| 事件 | 说明 | 参数 |
|------|------|------|
| `@select` | 菜单激活 | index, indexPath, item, routeResult |
| `@open` | sub-menu 展开 | index, indexPath |
| `@close` | sub-menu 收起 | index, indexPath |

### Menu Methods

| 方法 | 说明 |
|------|------|
| `open(index)` | 展开指定 sub-menu |
| `close(index)` | 收起指定 sub-menu |

---

## Tabs 标签页

```vue
<el-tabs v-model="activeTab" type="border-card" @tab-click="handleClick" @tab-remove="handleRemove">
  <el-tab-pane label="用户管理" name="users" lazy>
    <!-- 内容 -->
  </el-tab-pane>
  <el-tab-pane label="配置管理" name="config" :closable="true">
    <!-- 内容 -->
  </el-tab-pane>
  <el-tab-pane label="角色管理" name="roles" disabled>
    <!-- 内容 -->
  </el-tab-pane>
</el-tabs>
```

### Tabs Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `v-model` / `model-value` | 绑定值(选中标签) | string | — | 第一个 pane 的 name |
| `type` | 风格类型 | string | `card/border-card` | — |
| `closable` | 标签可关闭 | boolean | — | false |
| `addable` | 标签可添加 | boolean | — | false |
| `editable` | 可编辑(= closable + addable) | boolean | — | false |
| `tab-position` | 位置 | string | `top/right/bottom/left` | top |
| `stretch` | 标签自动撑开 | boolean | — | false |
| `before-leave` | 切换前钩子 | function(newName, oldName) => boolean/Promise | — | — |

### Tab-pane Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `label` | 标签标题 | string | — |
| `name` | 标签标识 | string | 序号 |
| `disabled` | 禁用 | boolean | false |
| `closable` | 可关闭 | boolean | false |
| `lazy` | 延迟渲染 | boolean | false |

---

## Breadcrumb 面包屑

```vue
<el-breadcrumb separator="/">
  <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
  <el-breadcrumb-item><a href="/">活动管理</a></el-breadcrumb-item>
  <el-breadcrumb-item>活动列表</el-breadcrumb-item>
  <el-breadcrumb-item>活动详情</el-breadcrumb-item>
</el-breadcrumb>
<!-- 图标分隔符 -->
<el-breadcrumb separator-icon="ArrowRight">
  ...
</el-breadcrumb>
```

---

## Dropdown 下拉菜单

```vue
<el-dropdown trigger="click" @command="handleCommand">
  <span class="el-dropdown-link">
    下拉菜单 <el-icon><ArrowDown /></el-icon>
  </span>
  <template #dropdown>
    <el-dropdown-menu>
      <el-dropdown-item command="a">黄金糕</el-dropdown-item>
      <el-dropdown-item command="b" disabled>狮子头</el-dropdown-item>
      <el-dropdown-item command="c" divided>螺蛳粉</el-dropdown-item>
    </el-dropdown-menu>
  </template>
</el-dropdown>
```

### Dropdown Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `trigger` | 触发方式 | string | `hover/click/contextmenu` | hover |
| `placement` | 出现位置 | string | `top/top-start/top-end/bottom/bottom-start/bottom-end` | bottom |
| `hide-on-click` | 点击菜单项后隐藏 | boolean | — | true |
| `split-button` | 下拉按钮模式 | boolean | — | false |
| `size` | 尺寸(下拉按钮模式) | string | — | — |
| `max-height` (Plus) | 菜单最大高度 | string/number | — | — |

---

## Steps 步骤条

```vue
<el-steps :active="activeStep" finish-status="success" align-center>
  <el-step title="步骤 1" description="描述文字" icon="Edit" />
  <el-step title="步骤 2" description="描述文字" />
  <el-step title="步骤 3" description="描述文字" status="error" />
</el-steps>
```

### Steps Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `active` | 当前步骤(从 0 开始) | number | 0 |
| `direction` | 方向 `vertical/horizontal` | string | horizontal |
| `process-status` | 当前步骤状态 `wait/process/finish/error/success` | string | process |
| `finish-status` | 完成步骤状态 | string | finish |
| `align-center` | 居中对齐 | boolean | false |
| `simple` | 简洁风格 | boolean | false |
| `space` | 步骤间距(px 或 auto) | number/string | — |

### Step Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 标题 | string | — |
| `description` | 描述 | string | — |
| `icon` | 图标 | string/component | — |
| `status` | 状态 | string | — |

---

## PageHeader 页头

```vue
<el-page-header @back="goBack" content="详情页面">
  <template #breadcrumb>
    <el-breadcrumb separator="/"><el-breadcrumb-item>首页</el-breadcrumb-item></el-breadcrumb>
  </template>
</el-page-header>
```

---

## Affix 固钉 (Plus only)

```vue
<el-affix :offset="120">
  <el-button type="primary">固定在顶部</el-button>
</el-affix>
<el-affix :offset="120" position="bottom">
  <el-button type="primary">固定在底部</el-button>
</el-affix>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `offset` | 偏移距离 | number | 0 |
| `position` | 位置 `top/bottom` | string | top |
| `target` | 滚动容器 | string/HTMLElement | window |
| `z-index` | z-index | number | 100 |

---

## Anchor 锚点 (Plus 2.6+)

```vue
<el-anchor :offset="100" @click="handleClick">
  <el-anchor-link href="#basic">基础用法</el-anchor-link>
  <el-anchor-link href="#advanced">高级用法</el-anchor-link>
  <el-anchor-link href="#api" title="API">
    <el-anchor-link href="#props">Props</el-anchor-link>
    <el-anchor-link href="#events">Events</el-anchor-link>
  </el-anchor-link>
</el-anchor>
```

### Anchor Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `offset` | 偏移 | number | 0 |
| `container` | 滚动容器 | string/HTMLElement | — |
| `bound` | 触发偏移 | number | 15 |
| `duration` | 滚动动画时间(ms) | number | 300 |
| `marker` | 显示标记 | boolean | false |
| `direction` | 方向 `vertical/horizontal` | string | vertical |
