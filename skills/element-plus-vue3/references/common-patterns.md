# 通用 API 模式参考（Common Patterns）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## 按需引入与打包优化

### Element UI — babel-plugin-component

```bash
npm install babel-plugin-component -D
```

```js
// .babelrc / babel.config.js
{
  "plugins": [
    ["component", {
      "libraryName": "element-ui",
      "styleLibraryName": "theme-chalk"
    }]
  ]
}
```

之后 `import { Button, Select } from 'element-ui'` 会自动引入对应 CSS。

### Element Plus — unplugin 自动按需引入（推荐）

```bash
npm install -D unplugin-vue-components unplugin-auto-import
```

```js
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
})
```

无需手动 import 组件，模板中直接使用 `<el-button>` 等标签即可。

### Element Plus — 手动按需引入

```js
import { ElButton, ElSelect } from 'element-plus'
app.component(ElButton.name, ElButton)
```

需要手动引入对应 CSS：
```js
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/select/style/css'
```

---

## 全局配置

### Element UI

```js
Vue.use(ElementUI, { size: 'small', zIndex: 3000 })
```

### Element Plus — ConfigProvider

```vue
<template>
  <el-config-provider :size="size" :z-index="zIndex" :locale="locale"
    :namespace="namespace" :button="buttonConfig">
    <App />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
const locale = zhCn
const size = ref('default')
const zIndex = ref(3000)
const namespace = ref('el')
const buttonConfig = ref({ autoInsertSpace: true })
</script>
```

### ConfigProvider Props (Plus)

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `size` | 全局尺寸 `large/default/small` | string | default |
| `z-index` | 弹窗初始 z-index | number | 2000 |
| `locale` | 国际化语言包 | object | 英文 |
| `namespace` | CSS 命名空间前缀 | string | el |
| `button` | 按钮配置 `{ autoInsertSpace }` | object | — |
| `message` | 消息配置 `{ max }` | object | — |

---

## 国际化

### Element UI

```js
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/zh-CN'
Vue.use(ElementUI, { locale })
```

### Element Plus

```js
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
app.use(ElementPlus, { locale: zhCn })
```

---

## 常见组合模式

### 表格 + 搜索 + 分页

```vue
<template>
  <div>
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="query">
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="搜索" clearable @keyup.enter="fetchData" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable @change="fetchData">
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="fetchData"
      @current-change="fetchData"
    />
  </div>
</template>
```

### 表单弹窗模式

```vue
<template>
  <el-button type="primary" @click="openDialog()">新增</el-button>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
```

### 侧边栏布局

```vue
<el-container style="height: 100vh">
  <el-aside :width="isCollapse ? '64px' : '200px'" style="transition: width 0.3s">
    <el-menu :default-active="route.path" :collapse="isCollapse" router>
      <el-menu-item index="/dashboard"><el-icon><HomeFilled /></el-icon><span>首页</span></el-menu-item>
      <el-sub-menu index="/system">
        <template #title><el-icon><Setting /></el-icon><span>系统</span></template>
        <el-menu-item index="/system/users">用户管理</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </el-aside>
  <el-container>
    <el-header>
      <el-button @click="isCollapse = !isCollapse">
        <el-icon><Fold /></el-icon>
      </el-button>
    </el-header>
    <el-main><router-view /></el-main>
  </el-container>
</el-container>
```

---

## 版本迁移速查表

### UI → Plus 常见替换

| Element UI | Element Plus | 说明 |
|-----------|-------------|------|
| `<el-submenu>` | `<el-sub-menu>` | 连字符命名 |
| `:visible.sync` | `v-model` | 双向绑定 |
| `:current-page.sync` | `v-model:current-page` | 分页 |
| `slot="footer"` | `#footer` 或 `v-slot:footer` | 具名插槽 |
| `slot-scope="scope"` | `#default="scope"` | 作用域插槽 |
| `.native` 修饰符 | 直接 `@click` | 原生事件 |
| `this.$message()` | `ElMessage()` | 服务调用导入方式 |
| `this.$confirm()` | `ElMessageBox.confirm()` | 弹框导入方式 |
| `this.$notify()` | `ElNotification()` | 通知导入方式 |
| `class="el-icon-edit"` | `<Edit />` 组件 | 图标使用 |
| `size="mini"` | `size="small"` | 尺寸变更 |
| `size="medium"` | `size="default"` | 尺寸变更 |
| `@click.native` | `@click` | 移除 .native |
| `$message` / `$confirm` | 需手动 import | 不再自动挂全局 |
