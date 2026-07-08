---
name: element-plus-vue3
description: Element Plus + Vue 3 组件库使用指南，含主题定制与按需引入。
category: framework
language: frontend
source: https://github.com/community/element-plus-vue3
---

# Element Plus + Vue 3

> **Element UI** = Vue 2 组件库 (`element-ui`) | **Element Plus** = Vue 3 组件库 (`element-plus`)
>
> 文档地址：
> - Element UI (Vue 2)：https://element.eleme.cn/#/zh-CN/component/installation
> - Element Plus (Vue 3)：https://element-plus.org/zh-CN/component/overview

## 0) 版本识别（必须先确认）

在开始任何 Element 相关任务前，先确认项目使用的版本：

| 标识 | Element UI (Vue 2) | Element Plus (Vue 3) |
|------|-------------------|---------------------|
| `package.json` 依赖 | `element-ui` | `element-plus` |
| Vue 版本 | `vue@2.x` | `vue@3.x` |
| 组件注册 | `Vue.use(ElementUI)` | `app.use(ElementPlus)` |
| 图标 | CSS class `el-icon-xxx` | `@element-plus/icons-vue` 组件 |
| 双向绑定 | `:prop.sync` | `v-model:prop` |
| 全局尺寸 | `{ size: 'small' }` | `{ size: 'small' }` |
| 事件修饰 | `.native` 修饰符 | 不需要，直接 `@click` |
| CSS 变量 | SCSS 变量覆盖 | CSS 变量覆盖（原生支持） |

确认版本后，在后续所有参考中优先查阅对应版本的用法。

## 1) 安装与引入（必须了解）

### Element UI (Vue 2)

```bash
npm install element-ui -S
```

完整引入：
```js
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)
```

按需引入（需 `babel-plugin-component`）：
```js
import { Button, Select } from 'element-ui'
Vue.component(Button.name, Button)
Vue.component(Select.name, Select)
```

### Element Plus (Vue 3)

```bash
npm install element-plus
npm install @element-plus/icons-vue  # 图标包
```

完整引入：
```js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
app.use(ElementPlus)
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
```

按需引入（推荐配合 `unplugin-vue-components` + `unplugin-auto-import`）：
```js
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
}
```

## 2) 组件分类索引（必须查阅）

按需求场景选择组件，加载对应 reference 文件：

### 2.1 基础组件 → [basic](references/basic.md)

布局、按钮、图标、链接、排版等基础设施。

| 组件 | 标签 | 用途 |
|------|------|------|
| Layout 布局 | `<el-row>` `<el-col>` | 24 栏栅格 |
| Container 布局容器 | `<el-container>` 等 | 页面整体布局 |
| Button 按钮 | `<el-button>` | 操作触发 |
| Icon 图标 | Vue2: class / Vue3: 组件 | 图标 |
| Link 链接 | `<el-link>` | 文字链接 |
| Text 文本 (Plus) | `<el-text>` | 文本样式 |
| Scrollbar 滚动条 (Plus) | `<el-scrollbar>` | 自定义滚动条 |
| Space 间距 (Plus) | `<el-space>` | 间距布局 |
| Typography 排版 (Plus) | — | 排版规范 |

### 2.2 表单组件 → [form](references/form.md)

数据录入、选择、上传等交互组件。

| 组件 | 标签 | 用途 |
|------|------|------|
| Form 表单 | `<el-form>` `<el-form-item>` | 表单容器 + 校验 |
| Input 输入框 | `<el-input>` | 文本输入 |
| InputNumber 数字输入 | `<el-input-number>` | 数值输入 |
| Select 选择器 | `<el-select>` `<el-option>` | 下拉选择 |
| Cascader 级联 | `<el-cascader>` | 多级联动 |
| DatePicker 日期 | `<el-date-picker>` | 日期选择 |
| TimePicker 时间 | `<el-time-picker>` | 时间选择 |
| Radio 单选 | `<el-radio>` | 单选框 |
| Checkbox 多选 | `<el-checkbox>` | 多选框 |
| Switch 开关 | `<el-switch>` | 开关切换 |
| Slider 滑块 | `<el-slider>` | 范围选择 |
| Rate 评分 | `<el-rate>` | 星星评分 |
| Upload 上传 | `<el-upload>` | 文件上传 |
| ColorPicker 颜色 | `<el-color-picker>` | 颜色选择 |
| Transfer 穿梭框 | `<el-transfer>` | 批量转移 |
| Autocomplete 补全 | `<el-autocomplete>` | 自动补全 |
| TreeSelect 树选择 (Plus) | `<el-tree-select>` | 树形下拉 |
| InputTag 标签输入 (Plus 2.9) | `<el-input-tag>` | 标签输入 |

### 2.3 数据展示 → [data-display](references/data-display.md)

表格、列表、树、卡片等展示组件。

| 组件 | 标签 | 用途 |
|------|------|------|
| Table 表格 | `<el-table>` `<el-table-column>` | 数据表格 |
| Tree 树形控件 | `<el-tree>` | 树形数据 |
| Pagination 分页 | `<el-pagination>` | 分页导航 |
| Tag 标签 | `<el-tag>` | 标记/分类 |
| Progress 进度 | `<el-progress>` | 进度展示 |
| Badge 徽章 | `<el-badge>` | 数字角标 |
| Avatar 头像 | `<el-avatar>` | 用户头像 |
| Card 卡片 | `<el-card>` | 信息卡片 |
| Carousel 走马灯 | `<el-carousel>` | 轮播图 |
| Collapse 折叠面板 | `<el-collapse>` | 手风琴 |
| Timeline 时间线 | `<el-timeline>` | 时间轴 |
| Descriptions 描述列表 (Plus) | `<el-descriptions>` | 键值对展示 |
| Empty 空状态 (Plus) | `<el-empty>` | 空数据占位 |
| Skeleton 骨架屏 (Plus) | `<el-skeleton>` | 加载占位 |
| Image 图片 (Plus) | `<el-image>` | 图片预览 |
| Result 结果页 (Plus) | `<el-result>` | 操作结果 |
| Statistic 统计 (Plus) | `<el-statistic>` | 数值统计 |

### 2.4 导航组件 → [navigation](references/navigation.md)

菜单、标签页、面包屑等导航。

| 组件 | 标签 | 用途 |
|------|------|------|
| NavMenu 菜单 | `<el-menu>` | 侧边/顶部导航 |
| Tabs 标签页 | `<el-tabs>` `<el-tab-pane>` | 内容切换 |
| Breadcrumb 面包屑 | `<el-breadcrumb>` | 路径导航 |
| Dropdown 下拉菜单 | `<el-dropdown>` | 操作菜单 |
| Steps 步骤条 | `<el-steps>` | 流程步骤 |
| PageHeader 页头 | `<el-page-header>` | 页面头部 |
| Affix 固钉 (Plus) | `<el-affix>` | 固定定位 |
| Anchor 锚点 (Plus) | `<el-anchor>` | 页内锚点 |

### 2.5 反馈组件 → [feedback](references/feedback.md)

弹窗、提示、加载等交互反馈。

| 组件 | 标签/调用 | 用途 |
|------|----------|------|
| Dialog 对话框 | `<el-dialog>` | 模态弹窗 |
| Drawer 抽屉 | `<el-drawer>` | 侧边抽屉 |
| Alert 提示 | `<el-alert>` | 静态提示 |
| Loading 加载 | `v-loading` 指令 | 加载状态 |
| Message 消息 | `ElMessage()` / `this.$message()` | 轻量提示 |
| MessageBox 弹框 | `ElMessageBox()` / `this.$confirm()` | 确认弹框 |
| Notification 通知 | `ElNotification()` / `this.$notify()` | 系统通知 |
| Tooltip 文字提示 | `<el-tooltip>` | hover 提示 |
| Popover 弹出框 | `<el-popover>` | 点击弹出 |
| Popconfirm 确认 | `<el-popconfirm>` | 气泡确认 |

### 2.6 其他组件 → [others](references/others.md)

| 组件 | 标签 | 用途 |
|------|------|------|
| Divider 分割线 | `<el-divider>` | 内容分隔 |
| Calendar 日历 | `<el-calendar>` | 日历展示 |
| Backtop 回到顶部 | `<el-backtop>` | 回到顶部 |
| InfiniteScroll 无限滚动 | `v-infinite-scroll` | 滚动加载 |
| Watermark 水印 (Plus) | `<el-watermark>` | 页面水印 |
| Tour 漫游引导 (Plus) | `<el-tour>` | 新手引导 |

## 3) 通用 API 模式（必须掌握）

加载详细参考：[common-patterns](references/common-patterns.md)

### 3.1 通用 Props

| Prop | 说明 | 适用组件 |
|------|------|---------|
| `v-model` | 双向绑定值 | 所有表单组件 |
| `size` | 尺寸 `large/default/small` (Plus) / `medium/small/mini` (UI) | Button, Input, Select 等 |
| `type` | 类型 `primary/success/warning/danger/info` | Button, Alert, Tag, Message |
| `disabled` | 禁用 | 所有交互组件 |
| `placeholder` | 占位文本 | Input, Select, DatePicker |
| `clearable` | 可清空 | Input, Select |
| `loading` | 加载状态 | Button, Table(v-loading), Select |

### 3.2 通用 Events

| 事件 | 说明 | 适用组件 |
|------|------|---------|
| `@change` | 值变化 | Select, Switch, Checkbox, Radio, DatePicker |
| `@input` | 输入时 | Input |
| `@click` | 点击 | Button |
| `@close` | 关闭 | Dialog, Drawer, Tag |
| `@confirm` / `@cancel` | 确认/取消 | Popconfirm, MessageBox |

### 3.3 版本关键差异速查

| 特性 | Element UI (Vue 2) | Element Plus (Vue 3) |
|------|-------------------|---------------------|
| 对话框显示 | `:visible.sync="visible"` | `v-model="visible"` |
| 分页当前页 | `:current-page.sync="page"` | `v-model:current-page="page"` |
| 表单校验 | callback 风格 | Promise 风格 + callback |
| 图标使用 | `<i class="el-icon-edit">` | `<Edit />` 或 `<el-icon><Edit /></el-icon>` |
| 暗色主题 | 需自定义 | 原生支持 `dark` 模式 |
| CSS 变量 | SCSS 编译时 | CSS 变量运行时可改 |
| 虚拟化表格 | 不支持 | `<el-table-v2>` (Virtualized Table) |
| 全局配置 | `Vue.use(ElementUI, { size })` | `<el-config-provider>` 组件 |
| 命名空间 | `el-` | 可自定义 via ConfigProvider |

## 4) 主题定制

加载详细参考：[theming](references/theming.md)

### Element UI (Vue 2) — SCSS 变量覆盖

```scss
$--color-primary: #409EFF;
$--font-path: '~element-ui/lib/theme-chalk/fonts';
@import "~element-ui/packages/theme-chalk/src/index";
```

### Element Plus (Vue 3) — CSS 变量覆盖

```css
:root {
  --el-color-primary: #409EFF;
  --el-color-success: #67C23A;
}
```

或通过 SCSS：
```scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': ('base': #409EFF),
  )
);
```

## 5) 常见任务速查

| 任务 | 参考文件 |
|------|---------|
| 布局页面 | [basic](references/basic.md) — Row/Col + Container |
| 创建表单 + 校验 | [form](references/form.md) — Form + rules + validate |
| 数据表格 + 分页 | [data-display](references/data-display.md) — Table + Pagination |
| 侧边栏导航 | [navigation](references/navigation.md) — Menu + Router |
| 弹窗/确认框 | [feedback](references/feedback.md) — Dialog / MessageBox |
| 自定义主题 | [theming](references/theming.md) |
| 版本迁移 UI → Plus | [migration](references/migration.md) |
| 按需引入 / 打包优化 | [common-patterns](references/common-patterns.md) |
