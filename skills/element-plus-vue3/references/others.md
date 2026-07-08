# 其他组件参考（Others）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## Divider 分割线

```vue
<el-divider />
<el-divider direction="vertical" />
<el-divider content-position="left">左侧标题</el-divider>
<el-divider><el-icon><Star /></el-icon></el-divider>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `direction` | 方向 | string | `horizontal/vertical` | horizontal |
| `content-position` | 文字位置 | string | `left/right/center` | center |
| `border-style` (Plus) | 线条样式 | string | — | solid |

---

## Calendar 日历

```vue
<el-calendar v-model="date">
  <template #date-cell="{ data }">
    <div>{{ data.day.split('-').slice(1).join('/') }}</div>
  </template>
</el-calendar>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `v-model` | 绑定日期 | Date | 当前日期 |
| `range` | 范围(限定月份) | [Date, Date] | — |

---

## Backtop 回到顶部

```vue
<el-backtop :visibility-height="300" :bottom="50" :right="40" target=".page-container">
  <div style="height: 100%; width: 100%; background-color: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow-lighter); text-align: center; line-height: 40px; color: #1989fa;">
    UP
  </div>
</el-backtop>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `target` | 触发滚动对象 | string | — |
| `visibility-height` | 滚动高度达到此值显示 | number | 200 |
| `right` | 距右边距离 | number | 40 |
| `bottom` | 距底部距离 | number | 40 |

---

## InfiniteScroll 无限滚动（指令）

```vue
<template>
  <ul class="infinite-list" v-infinite-scroll="load" :infinite-scroll-disabled="disabled"
    :infinite-scroll-distance="50" :infinite-scroll-immediate="false">
    <li v-for="item in list" :key="item.id" class="infinite-list-item">{{ item.name }}</li>
  </ul>
</template>
```

### 指令参数

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `v-infinite-scroll` | 加载更多方法 | function | — |
| `infinite-scroll-disabled` | 是否禁用 | boolean | false |
| `infinite-scroll-delay` | 节流延迟(ms) | number | 200 |
| `infinite-scroll-distance` | 触发距离(px) | number | 0 |
| `infinite-scroll-immediate` | 立即执行检查 | boolean | true |

---

## Watermark 水印 (Plus 2.4+)

```vue
<el-watermark :content="['Element Plus', 'Happy Working']" :width="130" :height="50"
  :rotate="-22" :font="{ color: 'rgba(0,0,0,0.15)', fontSize: 16 }">
  <div style="height: 500px">受水印保护的内容区域</div>
</el-watermark>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `width` | 水印宽度 | number | 120 |
| `height` | 水印高度 | number | 64 |
| `rotate` | 旋转角度 | number | -22 |
| `image` | 图片水印(优先于 content) | string | — |
| `content` | 文字水印 | string/array | — |
| `font` | 字体配置 `{ color, fontSize, fontWeight, fontFamily, fontStyle }` | object | — |
| `gap` | 间距 `[x, y]` | array | [100, 100] |
| `offset` | 偏移 `[x, y]` | array | [gap/2, gap/2] |
| `z-index` | z-index | number | 9 |
| `repeat` | 重复 | boolean | true |
| `interrogate` (Plus 2.7+) | 防篡改 | boolean | false |

---

## Tour 漫游式引导 (Plus 2.5+)

```vue
<template>
  <el-button ref="btnRef">按钮</el-button>
  <el-tour v-model="open" :steps="steps" />
</template>

<script setup>
import { ref } from 'vue'
const open = ref(false)
const btnRef = ref()
const steps = [
  { target: btnRef, title: '开始', description: '这是按钮' },
  { target: '.other-element', title: '第二步', description: '其他元素' },
]
</script>
```

### Tour Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `v-model` | 是否显示 | boolean | — |
| `steps` | 步骤配置 | array | — |
| `current` (Plus) | 当前步骤 | number | 0 |
| `type` | 类型 `default/primary` | string | default |
| `mask` | 遮罩配置 | boolean/object | true |
| `show-arrow` | 显示箭头 | boolean | true |
| `scroll-into-view-options` | 滚动对齐选项 | object/boolean | true |
| `z-index` | z-index | number | 2001 |
| `placement` | 弹出位置 | string | bottom |

### Step 配置

```ts
interface Step {
  target: string | HTMLElement | Ref // 目标元素
  title?: string
  description?: string
  placement?: string
  mask?: boolean | { style?: CSSProperties, color?: string }
  showArrow?: boolean
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions
}
```
