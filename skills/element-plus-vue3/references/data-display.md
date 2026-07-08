# 数据展示组件参考（Data Display）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## Table 表格

### 基础用法

```vue
<el-table :data="tableData" stripe border style="width: 100%" v-loading="loading"
  @selection-change="handleSelectionChange" @sort-change="handleSortChange">
  <el-table-column type="selection" width="55" />
  <el-table-column type="index" label="#" width="60" />
  <el-table-column prop="name" label="姓名" sortable width="120" />
  <el-table-column prop="date" label="日期" sortable="custom" width="150" />
  <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
  <el-table-column label="操作" width="180" fixed="right">
    <template #default="scope">
      <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
    </template>
  </el-table-column>
</el-table>
```

### Table Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `data` | 表格数据(必填) | array | — |
| `height` | 高度(固定表头) | string/number | — |
| `max-height` | 最大高度 | string/number | — |
| `stripe` | 斑马纹 | boolean | false |
| `border` | 纵向边框 | boolean | false |
| `size` | 尺寸 `large/default/small` | string | — |
| `show-header` | 显示表头 | boolean | true |
| `highlight-current-row` | 高亮当前行 | boolean | false |
| `row-key` | 行数据 key(树形/展开用) | function/string | — |
| `default-expand-all` | 展开所有行(树形) | boolean | false |
| `tree-props` | 树形配置 `{ children, hasChildren }` | object | — |
| `span-method` | 合并行/列 | function({ row, column, rowIndex, columnIndex }) | — |
| `lazy` | 懒加载 | boolean | false |
| `load` | 懒加载函数 | function(row, tree, resolve) | — |
| `empty-text` | 空数据文案 | string | 暂无数据 |

### Table Events

| 事件 | 说明 | 参数 |
|------|------|------|
| `@select` | 勾选变化 | selection, row |
| `@select-all` | 全选变化 | selection |
| `@selection-change` | 选中项变化 | selection |
| `@sort-change` | 排序变化 | { column, prop, order } |
| `@row-click` | 行点击 | row, column, event |
| `@row-dblclick` | 行双击 | row, column, event |
| `@cell-click` | 单元格点击 | row, column, cell, event |
| `@current-change` | 当前行变化(高亮模式) | currentRow, oldRow |
| `@expand-change` | 展开行变化 | row, expandedRows |

### Table Methods

| 方法 | 说明 |
|------|------|
| `toggleRowSelection(row, selected?)` | 切换行选中 |
| `toggleRowExpansion(row, expanded?)` | 切换行展开 |
| `clearSelection()` | 清除选中 |
| `sort(prop, order)` | 手动排序 |
| `clearSort()` | 清除排序 |
| `doLayout()` | 重新布局 |

### Table-column Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `type` | `selection/index/expand` | string | — |
| `prop` | 字段名 | string | — |
| `label` | 表头文本 | string | — |
| `width` | 列宽度 | string/number | — |
| `min-width` | 最小列宽(自适应) | string/number | — |
| `fixed` | 固定列 `true/left/right` | boolean/string | — |
| `sortable` | 排序 `true/false/custom` | boolean/string | false |
| `align` | 对齐 `left/center/right` | string | left |
| `header-align` | 表头对齐 | string | — |
| `show-overflow-tooltip` | 超出省略 tooltip | boolean | false |
| `formatter` | 格式化函数 | function(row, column, cellValue, index) | — |

### 展开行

```vue
<el-table :data="data">
  <el-table-column type="expand">
    <template #default="scope">
      <div>展开内容: {{ scope.row.detail }}</div>
    </template>
  </el-table-column>
</el-table>
```

### 自定义表头

```vue
<el-table-column prop="name" label="姓名">
  <template #header="scope">
    <el-input v-model="search" size="small" placeholder="搜索姓名" @input="handleFilter" />
  </template>
</el-table-column>
```

---

## Pagination 分页

```vue
<el-pagination
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  :page-sizes="[10, 20, 50, 100]"
  :total="total"
  layout="total, sizes, prev, pager, next, jumper"
  @size-change="handleSizeChange"
  @current-change="handlePageChange"
/>
```

> **版本差异**：Element UI 使用 `:current-page.sync` 和 `:page-size.sync`，Element Plus 使用 `v-model:current-page` 和 `v-model:page-size`。

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `total` | 总条目数 | number | — |
| `page-size` | 每页条数 | number | 10 |
| `current-page` | 当前页 | number | 1 |
| `page-sizes` | 每页条数选项 | number[] | [10,20,30,40,50,100] |
| `layout` | 布局组件 | string | prev, pager, next, jumper, ->, total |
| `background` | 按钮背景色 | boolean | false |
| `small` | 小型分页 | boolean | false |
| `hide-on-single-page` | 只有一页时隐藏 | boolean | false |

### layout 可选值

`total`, `sizes`, `prev`, `pager`, `next`, `jumper`, `->`(右对齐)

---

## Tree 树形控件

```vue
<el-tree
  :data="treeData"
  :props="defaultProps"
  show-checkbox
  node-key="id"
  default-expand-all
  :expand-on-click-node="false"
  :check-strictly="false"
  @node-click="handleNodeClick"
  @check-change="handleCheckChange"
>
  <template #default="{ node, data }">
    <span>{{ node.label }} <el-button size="small" @click.stop="handleEdit(data)">编辑</el-button></span>
  </template>
</el-tree>
```

### 数据格式

```js
const treeData = [
  { id: 1, label: '一级 1', children: [
    { id: 4, label: '二级 1-1' }
  ]},
  { id: 2, label: '一级 2' }
]
const defaultProps = { children: 'children', label: 'label' }
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `data` | 树数据 | array | — |
| `props` | 字段映射配置 | object | — |
| `node-key` | 节点唯一标识 | string | — |
| `show-checkbox` | 显示复选框 | boolean | false |
| `check-strictly` | 父子不关联 | boolean | false |
| `default-expand-all` | 默认展开所有 | boolean | false |
| `default-expanded-keys` | 默认展开节点 | array | — |
| `default-checked-keys` | 默认勾选节点 | array | — |
| `lazy` | 懒加载 | boolean | false |
| `load` | 懒加载函数 | function(node, resolve) | — |
| `filter-node-method` | 过滤函数 | function(value, data, node) | — |
| `accordion` | 手风琴模式 | boolean | false |
| `draggable` | 可拖拽 | boolean | false |

### Methods

| 方法 | 说明 |
|------|------|
| `setCheckedKeys(keys)` | 设置勾选节点 |
| `getCheckedKeys()` | 获取勾选节点 key |
| `getCheckedNodes()` | 获取勾选节点数据 |
| `setCurrentKey(key)` | 设置当前选中 |
| `getNode(data/key)` | 获取节点 |
| `filter(val)` | 过滤树节点 |
| `append(data, parentNode)` | 追加节点 |
| `remove(data/node)` | 删除节点 |

---

## Tag 标签

```vue
<el-tag type="primary" closable @close="handleClose" effect="dark" round>
  标签一
</el-tag>
<!-- 动态编辑 -->
<el-tag v-for="tag in tags" :key="tag" closable @close="tags.splice(tags.indexOf(tag), 1)">
  {{ tag }}
</el-tag>
<el-input v-if="inputVisible" ref="inputRef" v-model="inputValue"
  @keyup.enter="handleInputConfirm" @blur="handleInputConfirm" size="small" />
<el-button v-else size="small" @click="inputVisible = true">+ New Tag</el-button>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `type` | 类型 | string | `primary/success/warning/danger/info` | — |
| `closable` | 可关闭 | boolean | — | false |
| `effect` | 主题 | string | `dark/light/plain` | light |
| `hit` | 描边 | boolean | — | false |
| `round` (Plus) | 圆角 | boolean | — | false |
| `size` | 尺寸 | string | UI: `medium/small/mini` / Plus: `large/default/small` | — |

---

## Progress 进度条

```vue
<el-progress :percentage="50" />
<el-progress :percentage="80" status="success" />
<el-progress :percentage="30" status="exception" />
<!-- 环形 -->
<el-progress type="circle" :percentage="75" :width="120" />
<!-- 仪表盘 -->
<el-progress type="dashboard" :percentage="percentage" :color="customColors" />
```

---

## Badge 徽章

```vue
<el-badge :value="12" :max="99">
  <el-button>消息</el-button>
</el-badge>
<el-badge :value="200" :max="99" type="warning">
  <el-button>回复</el-button>
</el-badge>
<el-badge is-dot>新消息</el-badge>
```

---

## Avatar 头像 (Plus 内置，UI 2.12+)

```vue
<el-avatar :size="50" :src="avatarUrl" />
<el-avatar icon="UserFilled" />
<el-avatar shape="square">U</el-avatar>
```

---

## Card 卡片

```vue
<el-card shadow="hover" :body-style="{ padding: '20px' }">
  <template #header>
    <div class="card-header"><span>卡片标题</span><el-button text>操作</el-button></div>
  </template>
  卡片内容
</el-card>
```

### Props

| Prop | 说明 | 类型 | 可选值 | 默认值 |
|------|------|------|--------|--------|
| `shadow` | 阴影时机 | string | `always/hover/never` | always |

---

## Carousel 走马灯

```vue
<el-carousel height="300px" :interval="3000" arrow="hover" indicator-position="outside">
  <el-carousel-item v-for="item in items" :key="item.id">
    <img :src="item.url" style="width:100%" />
  </el-carousel-item>
</el-carousel>
```

---

## Collapse 折叠面板

```vue
<el-collapse v-model="activeNames" accordion>
  <el-collapse-item title="标题一" name="1">
    内容一
  </el-collapse-item>
  <el-collapse-item title="标题二" name="2">
    内容二
  </el-collapse-item>
</el-collapse>
```

---

## Timeline 时间线

```vue
<el-timeline>
  <el-timeline-item timestamp="2024-01-01" placement="top" color="#0bbd87">
    <el-card><h4>更新 Github 模板</h4></el-card>
  </el-timeline-item>
  <el-timeline-item timestamp="2024-01-02">活动按期开始</el-timeline-item>
</el-timeline>
```

---

## Descriptions 描述列表 (Plus 内置，UI 2.15+)

```vue
<el-descriptions title="用户信息" :column="3" border>
  <el-descriptions-item label="用户名">张三</el-descriptions-item>
  <el-descriptions-item label="手机号">13800138000</el-descriptions-item>
  <el-descriptions-item label="地址">上海市</el-descriptions-item>
</el-descriptions>
```

---

## Skeleton 骨架屏 (Plus only)

```vue
<el-skeleton :loading="loading" animated :count="3">
  <template #default>
    <div>实际内容</div>
  </template>
  <template #template>
    <el-skeleton-item variant="h3" style="width: 50%" />
    <el-skeleton-item variant="text" style="margin-top: 16px" />
    <el-skeleton-item variant="text" style="margin-top: 16px" />
  </template>
</el-skeleton>
```

### Skeleton variant

`text`, `circle`, `rect`, `h1`, `h3`, `caption`, `button`, `image`, `p`

---

## Statistic 统计数值 (Plus 2.2.30+)

```vue
<el-statistic title="月活跃用户" :value="268500" />
<el-statistic title="增长率" :value="12.18">
  <template #suffix>%</template>
</el-statistic>
```

---

## Result 结果页 (Plus only)

```vue
<el-result icon="success" title="操作成功" sub-title="请根据提示进行操作">
  <template #extra><el-button type="primary">返回</el-button></template>
</el-result>
```

### icon 可选值

`success`, `warning`, `info`, `error`
