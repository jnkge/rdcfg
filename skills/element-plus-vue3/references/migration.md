# 版本迁移参考：Element UI → Element Plus

> 将项目从 Element UI (Vue 2) 迁移到 Element Plus (Vue 3) 的关键差异

## 前置条件

先完成 Vue 2 → Vue 3 的迁移，再处理 Element 层面的迁移。

## 包替换

```bash
# 卸载 Element UI
npm uninstall element-ui

# 安装 Element Plus
npm install element-plus @element-plus/icons-vue
```

## 全局注册变更

```js
// Element UI (Vue 2)
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI, { size: 'small' })

// Element Plus (Vue 3)
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
const app = createApp(App)
app.use(ElementPlus, { size: 'small' })
app.mount('#app')
```

## 组件名称变更

| Element UI | Element Plus | 说明 |
|-----------|-------------|------|
| `<el-submenu>` | `<el-sub-menu>` | 连字符化 |
| `<el-menu-item-group>` | 已移除 | 不再提供 |
| `<el-tab-pane>` | `<el-tab-pane>` | 不变 |

## API 变更清单

### 双向绑定

```vue
<!-- Element UI -->
<el-dialog :visible.sync="visible" />
<el-drawer :visible.sync="visible" />
<el-pagination :current-page.sync="page" :page-size.sync="size" />

<!-- Element Plus -->
<el-dialog v-model="visible" />
<el-drawer v-model="visible" />
<el-pagination v-model:current-page="page" v-model:page-size="size" />
```

### 事件绑定

```vue
<!-- Element UI — 需要 .native 修饰符 -->
<el-button @click.native="handler" />
<el-input @keyup.enter.native="handler" />

<!-- Element Plus — 直接绑定 -->
<el-button @click="handler" />
<el-input @keyup.enter="handler" />
```

### 插槽语法

```vue
<!-- Element UI — 旧语法 -->
<el-dialog>
  <span slot="footer">按钮</span>
</el-table>
<el-table-column>
  <template slot="header">表头</template>
  <template slot-scope="scope">内容 {{ scope.row }}</template>
</el-table-column>

<!-- Element Plus — 新语法 -->
<el-dialog>
  <template #footer>按钮</template>
</el-dialog>
<el-table-column>
  <template #header>表头</template>
  <template #default="scope">内容 {{ scope.row }}</template>
</el-table-column>
```

### 服务式调用

```js
// Element UI — 挂载到 Vue 原型
this.$message('消息')
this.$message.success('成功')
this.$confirm('确定？').then(() => {})
this.$notify({ title: '通知' })
this.$alert('内容')

// Element Plus — 需要显式 import
import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

ElMessage('消息')
ElMessage.success('成功')
ElMessageBox.confirm('确定？').then(() => {})
ElNotification({ title: '通知' })
ElMessageBox.alert('内容')
```

### 图标

```vue
<!-- Element UI — CSS class -->
<i class="el-icon-edit"></i>
<el-button icon="el-icon-search">搜索</el-button>

<!-- Element Plus — 组件 -->
<script setup>
import { Edit, Search } from '@element-plus/icons-vue'
</script>
<el-icon><Edit /></el-icon>
<el-button :icon="Search">搜索</el-button>
```

### 尺寸值变更

| Element UI | Element Plus |
|-----------|-------------|
| `medium` | `default` |
| `small` | `small` |
| `mini` | `small` (无更小尺寸) |

### 表单校验

```js
// Element UI
this.$refs.form.validate((valid) => {
  if (valid) { /* 通过 */ }
})

// Element Plus — 支持 Promise
const valid = await formRef.value.validate().catch(() => false)
// 或仍然支持 callback
formRef.value.validate((valid) => { ... })
```

### Popover/Tooltip

```vue
<!-- Element UI -->
<el-popover>
  <el-button slot="reference">触发</el-button>
</el-popover>

<!-- Element Plus -->
<el-popover>
  <template #reference>
    <el-button>触发</el-button>
  </template>
</el-popover>
```

### Dialog

```vue
<!-- Element UI -->
<el-dialog :visible.sync="visible" :show-close="true" custom-class="my-dialog">
  <span slot="title">标题</span>
  <span slot="footer">底部</span>
</el-dialog>

<!-- Element Plus -->
<el-dialog v-model="visible" :show-close="true" class="my-dialog">
  <template #header>标题</template>
  <template #footer>底部</template>
</el-dialog>
```

> `custom-class` → `class`：Element Plus 直接使用 `class` 属性。

### Table

```vue
<!-- Element UI — selection 模板 -->
<el-table-column type="selection" :selectable="canSelect" />

<!-- Element Plus — 相同但事件名可能不同 -->
<el-table-column type="selection" :selectable="canSelect" />
```

Table-column `selectable` 签名变更：

```js
// UI: (row, index) => boolean
// Plus: (row, index) => boolean  — 相同
```

### Pagination

```vue
<!-- Element UI -->
<el-pagination
  :current-page="page"
  :page-size="size"
  @size-change="onSizeChange"
  @current-change="onPageChange"
/>

<!-- Element Plus -->
<el-pagination
  v-model:current-page="page"
  v-model:page-size="size"
  @size-change="onSizeChange"
  @current-change="onPageChange"
/>
```

### ConfigProvider

```vue
<!-- Element Plus 新增 — 替代全局配置 -->
<el-config-provider :locale="zhCn" :size="default">
  <App />
</el-config-provider>
```

## 已移除的功能

| 功能 | 替代方案 |
|------|---------|
| `type="text"` 按钮 | `link` 属性 或 `<el-link>` |
| `.native` 事件修饰符 | 直接使用 `@event` |
| `custom-class` 属性 | 直接使用 `class` |
| `slot="xxx"` 旧语法 | `#xxx` 或 `v-slot:xxx` |
| `slot-scope` 旧语法 | `#default="scope"` |
| `$message` 等原型方法 | 显式 `import { ElMessage }` |

## 迁移检查清单

1. [ ] 替换包：`element-ui` → `element-plus` + `@element-plus/icons-vue`
2. [ ] 更新全局注册方式
3. [ ] 全局搜索替换 `.sync` → `v-model:` / `v-model`
4. [ ] 全局搜索替换 `.native` → 删除
5. [ ] 全局搜索替换 `slot="xxx"` → `#xxx`
6. [ ] 全局搜索替换 `slot-scope` → `#default`
7. [ ] 替换 `this.$message` 等 → `import { ElMessage }`
8. [ ] 替换 `el-icon-xxx` class → 图标组件
9. [ ] 更新尺寸 `mini/medium` → `small/default`
10. [ ] 更新 `custom-class` → `class`
11. [ ] 更新 `<el-submenu>` → `<el-sub-menu>`
12. [ ] 测试主题定制兼容性
13. [ ] 测试表单校验兼容性
