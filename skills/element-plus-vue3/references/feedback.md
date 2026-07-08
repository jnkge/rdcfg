# 反馈组件参考（Feedback）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## Dialog 对话框

### 基础用法

```vue
<template>
  <!-- Element UI -->
  <el-dialog title="提示" :visible.sync="dialogVisible" width="30%" :before-close="handleClose">
    <span>这是一段信息</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="dialogVisible = false">确定</el-button>
    </span>
  </el-dialog>

  <!-- Element Plus -->
  <el-dialog v-model="dialogVisible" title="提示" width="30%" :before-close="handleClose">
    <span>这是一段信息</span>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="dialogVisible = false">确定</el-button>
    </template>
  </el-dialog>
</template>
```

> **版本差异**：Element UI 用 `:visible.sync` + `slot="footer"`，Element Plus 用 `v-model` + `#footer` slot。

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `v-model` (Plus) / `visible` (UI) | 是否显示 | boolean | false |
| `title` | 标题 | string | — |
| `width` | 宽度 | string | 50% |
| `fullscreen` | 全屏 | boolean | false |
| `top` | 距顶部距离 | string | 15vh |
| `modal` | 遮罩层 | boolean | true |
| `modal-class` (Plus) | 遮罩层类名 | string | — |
| `append-to-body` | 插入 body | boolean | false |
| `lock-scroll` | 锁定滚动 | boolean | true |
| `close-on-click-modal` | 点遮罩关闭 | boolean | true |
| `close-on-press-escape` | ESC 关闭 | boolean | true |
| `show-close` | 显示关闭按钮 | boolean | true |
| `before-close` | 关闭前回调 | function(done) | — |
| `center` | 头尾居中 | boolean | false |
| `destroy-on-close` | 关闭时销毁 | boolean | false |
| `draggable` (Plus) | 可拖拽 | boolean | false |
| `align-center` (Plus) | 水平垂直居中 | boolean | false |
| `overflow` (Plus 2.8+) | 拖拽溢出限制 | boolean | false |

### Events

| 事件 | 说明 |
|------|------|
| `@open` | 打开动画开始 |
| `@opened` | 打开动画结束 |
| `@close` | 关闭动画开始 |
| `@closed` | 关闭动画结束 |
| `@close-auto-focus` (Plus) | 关闭后焦点回到触发元素 |

---

## Drawer 抽屉

```vue
<!-- Element UI -->
<el-drawer title="标题" :visible.sync="drawerVisible" direction="rtl" size="50%">
  <span>内容</span>
</el-drawer>

<!-- Element Plus -->
<el-drawer v-model="drawerVisible" title="标题" direction="rtl" size="50%">
  <span>内容</span>
</el-drawer>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `v-model` (Plus) / `visible` (UI) | 是否显示 | boolean | — | false |
| `title` | 标题 | string | — | — |
| `size` | 尺寸 | string/number | — | 30% |
| `direction` | 打开方向 | string | `rtl/ltr/ttb/btt` | rtl |
| `before-close` | 关闭前回调 | function(done) | — | — |
| `append-to-body` | 插入 body | boolean | — | false |
| `modal` | 遮罩层 | boolean | — | true |
| `close-on-press-escape` | ESC 关闭 | boolean | — | true |
| `show-close` | 显示关闭按钮 | boolean | — | true |
| `with-header` | 显示 header | boolean | — | true |
| `destroy-on-close` | 关闭销毁 | boolean | — | false |
| `modal-class` (Plus) | 遮罩层类名 | string | — | — |

---

## Alert 提示

```vue
<el-alert title="成功提示" type="success" description="描述文字" show-icon :closable="true" center />
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `title` | 标题(必填) | string | — | — |
| `type` | 类型 | string | `success/warning/info/error` | info |
| `description` | 描述 | string | — | — |
| `closable` | 可关闭 | boolean | — | true |
| `center` | 居中 | boolean | — | false |
| `show-icon` | 显示图标 | boolean | — | false |
| `effect` (Plus) | 主题 | string | `dark/light` | light |

---

## Loading 加载

### 指令方式

```vue
<el-table v-loading="loading" element-loading-text="拼命加载中..."
  element-loading-spinner="el-icon-loading" element-loading-background="rgba(0,0,0,0.8)">
</el-table>
<!-- 全屏 -->
<div v-loading.fullscreen.lock="fullscreenLoading"></div>
```

### 服务方式

```js
// Element UI
const loading = this.$loading({ lock: true, text: '加载中...', spinner: 'el-icon-loading', background: 'rgba(0,0,0,0.7)' })
loading.close()

// Element Plus
import { ElLoading } from 'element-plus'
const loading = ElLoading.service({ lock: true, text: '加载中...', background: 'rgba(0,0,0,0.7)' })
loading.close()
```

---

## Message 消息提示

```js
// Element UI
this.$message('默认消息')
this.$message({ message: '成功', type: 'success' })
this.$message.error('错误消息')
this.$message.warning('警告消息')
this.$message.info('信息消息')

// Element Plus
import { ElMessage } from 'element-plus'
ElMessage('默认消息')
ElMessage.success('成功消息')
ElMessage({ message: '消息', type: 'success', duration: 3000, showClose: true })
```

### Options

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `message` | 消息文字/VNode | string/VNode | — |
| `type` | 类型 `success/warning/info/error` | string | info |
| `duration` | 显示时间(ms)，0 不关闭 | number | 3000 |
| `showClose` | 显示关闭按钮 | boolean | false |
| `center` | 居中 | boolean | false |
| `closable` (Plus) | 可关闭 | boolean | true |
| `offset` (Plus) | 距顶部偏移 | number | 20 |
| `grouping` (Plus 2.7+) | 合并相同消息 | boolean | false |
| `append-to` (Plus) | 挂载位置 | string/HTMLElement | body |

### 方法

```js
const msg = ElMessage({ message: '可关闭的消息' })
msg.close() // 手动关闭
```

---

## MessageBox 消息弹框

```js
// Element UI
this.$alert('内容', '标题', { confirmButtonText: '确定' })
  .then(() => {})

this.$confirm('确定删除？', '提示', {
  confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
}).then(() => { /* 确定 */ }).catch(() => { /* 取消 */ })

this.$prompt('请输入邮箱', '提示', {
  confirmButtonText: '确定', cancelButtonText: '取消',
  inputPattern: /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,
  inputErrorMessage: '邮箱格式不正确'
}).then(({ value }) => { /* value 是输入值 */ }).catch(() => {})

// Element Plus
import { ElMessageBox } from 'element-plus'
ElMessageBox.alert('内容', '标题', { confirmButtonText: '确定' })
ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
ElMessageBox.prompt('请输入', '提示', { inputPattern: /.../, inputErrorMessage: '格式错误' })
```

### Options

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 标题 | string | — |
| `message` | 内容 | string/VNode | — |
| `type` | 类型 `success/warning/info/error` | string | — |
| `confirmButtonText` | 确定按钮文字 | string | 确定 |
| `cancelButtonText` | 取消按钮文字 | string | 取消 |
| `showCancelButton` | 显示取消按钮 | boolean | false(alert)/true(confirm,prompt) |
| `showClose` | 显示右上角关闭 | boolean | true |
| `closeOnClickModal` | 点遮罩关闭 | boolean | false(alert)/true(confirm,prompt) |
| `closeOnPressEscape` | ESC 关闭 | boolean | true |
| `dangerouslyUseHTMLString` | message 当 HTML | boolean | false |
| `inputPlaceholder` | prompt 输入框占位 | string | — |
| `inputPattern` | prompt 正则校验 | regexp | — |
| `inputErrorMessage` | prompt 校验错误提示 | string | — |

---

## Notification 通知

```js
// Element UI
this.$notify({ title: '标题', message: '通知内容', type: 'success', duration: 4500 })
this.$notify.success({ title: '成功', message: '操作成功' })

// Element Plus
import { ElNotification } from 'element-plus'
ElNotification({ title: '标题', message: '通知内容', type: 'success' })
ElNotification.success('成功消息')
```

### Options

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 标题 | string | — |
| `message` | 内容 | string/VNode | — |
| `type` | 类型 `success/warning/info/error` | string | — |
| `duration` | 显示时间(ms)，0 不关闭 | number | 4500 |
| `position` (Plus) | 位置 `top-right/top-left/bottom-right/bottom-left` | string | top-right |
| `showClose` | 显示关闭 | boolean | true |
| `offset` | 偏移 | number | 0 |

### 方法

```js
const notify = ElNotification({ ... })
notify.close() // 手动关闭
```

---

## Tooltip 文字提示

```vue
<el-tooltip content="提示文字" placement="top" :open-delay="300" effect="dark">
  <el-button>鼠标悬停</el-button>
</el-tooltip>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `content` | 提示内容 | string | — | — |
| `placement` | 出现位置 | string | top/top-start/top-end/bottom/bottom-start/bottom-end/left/right | bottom |
| `effect` | 主题 | string | `dark/light` | dark |
| `disabled` | 禁用 | boolean | — | false |
| `offset` | 偏移距离 | number | 0 |
| `transition` | 动画名 | string | el-fade-in |
| `show-after` (Plus) / `open-delay` (UI) | 延迟显示(ms) | number | 0 |
| `hide-after` (Plus) | 延迟隐藏(ms) | number | 0 |
| `enterable` | 鼠标可进入 tooltip | boolean | true |

---

## Popover 弹出框

```vue
<el-popover placement="bottom" title="标题" :width="200" trigger="click" content="内容">
  <template #reference>
    <el-button>点击激活</el-button>
  </template>
</el-popover>
```

> **版本差异**：Element UI 用 `slot="reference"`，Element Plus 用 `#reference` template slot。

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `trigger` | 触发方式 | string | `click/focus/hover/manual` | click |
| `title` | 标题 | string | — | — |
| `content` | 内容 | string | — | — |
| `width` | 宽度 | string/number | — | 最小宽度 150px |
| `placement` | 位置 | string | 同 Tooltip | bottom |
| `visible` (Plus) / `value` (UI) | 手动控制 | boolean | — | — |
| `visible-arrow` (UI) | 显示箭头 | boolean | — | true |

---

## Popconfirm 气泡确认框

```vue
<el-popconfirm title="确定删除吗？" confirm-button-text="确定" cancel-button-text="取消"
  @confirm="handleConfirm" @cancel="handleCancel">
  <template #reference>
    <el-button type="danger">删除</el-button>
  </template>
</el-popconfirm>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 标题 | string | — |
| `confirm-button-text` | 确定按钮文字 | string | 确定 |
| `cancel-button-text` | 取消按钮文字 | string | 取消 |
| `confirm-button-type` (Plus) | 确定按钮类型 | string | primary |
| `cancel-button-type` (Plus) | 取消按钮类型 | string | — |
| `icon` (Plus) | 图标 | string/component | — |
| `icon-color` (Plus) | 图标颜色 | string | #f90 |
| `width` (Plus) | 宽度 | string/number | 150 |
