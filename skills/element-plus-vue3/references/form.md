# 表单组件参考（Form）

> 适用于 Element UI (Vue 2) 和 Element Plus (Vue 3)

## Form 表单

由输入框、选择器、单选框、多选框等控件组成，配合校验规则使用。

### 基础用法

```vue
<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="80px"
    :label-position="'right'"
    size="default"
  >
    <el-form-item label="名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item label="状态" prop="status">
      <el-select v-model="form.status" placeholder="请选择" clearable>
        <el-option label="启用" value="active" />
        <el-option label="禁用" value="inactive" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>
```

### 表单校验

```js
// Element UI (Vue 2) - Options API
data() {
  return {
    form: { name: '', status: '' },
    rules: {
      name: [
        { required: true, message: '请输入名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度 2-20 个字符', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }
  }
},
methods: {
  submitForm() {
    this.$refs.formRef.validate((valid) => {
      if (valid) { /* 提交 */ }
    })
  },
  resetForm() {
    this.$refs.formRef.resetFields()
  }
}
```

```vue
<!-- Element Plus (Vue 3) - Composition API -->
<script setup>
import { ref, reactive } from 'vue'

const formRef = ref()
const form = reactive({ name: '', status: '' })
const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度 2-20 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// Element Plus 支持 Promise 风格
const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (valid) { /* 提交 */ }
}
const resetForm = () => formRef.value.resetFields()
</script>
```

### 自定义校验器

```js
const validatePass = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码不少于6位'))
  } else {
    callback()
  }
}
// rules 中使用
rules: { password: [{ validator: validatePass, trigger: 'blur' }] }
```

### Form Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `model` | 表单数据对象(必填) | object | — |
| `rules` | 校验规则 | object | — |
| `label-position` | 标签位置 `right/left/top` | string | right |
| `label-width` | 标签宽度 | string | — |
| `inline` | 行内表单 | boolean | false |
| `size` | 控件尺寸 | string | — |
| `disabled` | 禁用所有控件 | boolean | false |
| `validate-on-rule-change` | 规则变化时触发校验 | boolean | true |
| `hide-required-asterisk` | 隐藏必填星号 | boolean | false |
| `status-icon` (Plus) | 输入框显示校验结果图标 | boolean | false |

### Form Methods

| 方法 | 说明 | 参数 |
|------|------|------|
| `validate(callback?)` | 校验整个表单 | callback(valid) 或返回 Promise (Plus) |
| `validateField(props, callback?)` | 校验指定字段 | prop 名或数组 |
| `resetFields()` | 重置表单并移除校验结果 | — |
| `clearValidate(props?)` | 清除校验结果 | prop 名或数组 |

### Form-Item Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `prop` | model 中的字段名(校验用) | string | — |
| `label` | 标签文本 | string | — |
| `label-width` | 标签宽度(覆盖 form) | string | — |
| `required` | 必填(自动生成规则) | boolean | false |
| `rules` | 该字段的校验规则 | object/array | — |
| `size` | 控件尺寸 | string | — |
| `error` | 错误信息(手动设置) | string | — |

---

## Input 输入框

```vue
<el-input v-model="value" placeholder="请输入" clearable maxlength="50" show-word-limit />

<!-- 文本域 -->
<el-input v-model="value" type="textarea" :rows="4" resize="vertical" />

<!-- 复合型输入 -->
<el-input v-model="value" placeholder="请输入">
  <template #prepend>Http://</template>
  <template #append>.com</template>
</el-input>

<!-- 带图标 -->
<el-input v-model="value" prefix-icon="Search" suffix-icon="Calendar" />
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `type` | 类型 `text/textarea/其他原生` | string | text |
| `v-model` / `model-value` | 绑定值 | string/number | — |
| `placeholder` | 占位文本 | string | — |
| `clearable` | 可清空 | boolean | false |
| `maxlength` | 最大长度 | number | — |
| `show-word-limit` | 显示字数统计 | boolean | false |
| `disabled` | 禁用 | boolean | false |
| `size` | 尺寸 | string | — |
| `prefix-icon` | 前缀图标 | string/component | — |
| `suffix-icon` | 后缀图标 | string/component | — |
| `rows` | textarea 行数 | number | 2 |
| `resize` | textarea 缩放方向 | string | — |

### Events

| 事件 | 说明 | 参数 |
|------|------|------|
| `@input` | 输入时 | value |
| `@change` | 值变化且失焦时 | value |
| `@blur` | 失焦 | event |
| `@focus` | 聚焦 | event |
| `@clear` | 清空按钮点击 | — |

---

## Select 选择器

```vue
<el-select v-model="value" placeholder="请选择" clearable filterable multiple>
  <el-option label="选项一" value="1" :disabled="false" />
  <el-option label="选项二" value="2" />
  <el-option-group label="分组名">
    <el-option label="选项三" value="3" />
  </el-option-group>
</el-select>
```

### Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `v-model` | 绑定值 | string/number/array(multiple) | — |
| `multiple` | 多选 | boolean | false |
| `filterable` | 可搜索 | boolean | false |
| `remote` | 远程搜索(配合 filterable) | boolean | false |
| `remote-method` | 远程搜索方法 | function(query) | — |
| `clearable` | 可清空 | boolean | false |
| `disabled` | 禁用 | boolean | false |
| `placeholder` | 占位文本 | string | 请选择 |
| `collapse-tags` (Plus) | 多选折叠 Tag | boolean | false |
| `collapse-tags-tooltip` (Plus) | 折叠 Tag 时显示 tooltip | boolean | false |

### 远程搜索

```vue
<el-select v-model="value" filterable remote :remote-method="remoteMethod" :loading="loading">
  <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
</el-select>
```

---

## DatePicker 日期选择器

```vue
<!-- 日期 -->
<el-date-picker v-model="date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
<!-- 日期范围 -->
<el-date-picker v-model="range" type="daterange" start-placeholder="开始" end-placeholder="结束"
  value-format="YYYY-MM-DD" :shortcuts="shortcuts" />
<!-- 日期时间 -->
<el-date-picker v-model="datetime" type="datetime" placeholder="选择日期时间" />
<!-- 月份 -->
<el-date-picker v-model="month" type="month" placeholder="选择月份" />
```

### type 可选值

| type | 说明 |
|------|------|
| `date` | 日期 |
| `daterange` | 日期范围 |
| `datetime` | 日期+时间 |
| `datetimerange` | 日期时间范围 |
| `month` | 月 |
| `monthrange` | 月份范围 |
| `year` | 年 |
| `week` (Plus) | 周 |

### 常用 Props

| Prop | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `v-model` | 绑定值 | date/string/array | — |
| `type` | 类型(见上表) | string | date |
| `format` | 显示格式 | string | YYYY-MM-DD |
| `value-format` | 绑定值格式 | string | — (Date 对象) |
| `placeholder` | 占位文本 | string | — |
| `disabled` | 禁用 | boolean | false |
| `clearable` | 可清空 | boolean | true |
| `shortcuts` | 快捷选项 | array | — |
| `disabled-date` | 禁用日期函数 | function(Date) => boolean | — |

### Element Plus shortcuts 写法

```js
const shortcuts = [
  { text: '今天', value: new Date() },
  { text: '昨天', value: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d } },
  { text: '最近一周', value: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return [start, end]
  }},
]
```

---

## 其他表单组件速查

### Radio 单选

```vue
<el-radio-group v-model="radio">
  <el-radio :label="1">选项A</el-radio>
  <el-radio :label="2">选项B</el-radio>
  <el-radio-button :label="3">按钮式C</el-radio-button>
</el-radio-group>
```

### Checkbox 多选

```vue
<el-checkbox-group v-model="checkedList">
  <el-checkbox label="A" />
  <el-checkbox label="B" />
  <el-checkbox-button label="C">按钮式</el-checkbox-button>
</el-checkbox-group>
<!-- indeterminate: 全选半选状态 -->
<el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAll">
  全选
</el-checkbox>
```

### Switch 开关

```vue
<el-switch v-model="value" active-text="开" inactive-text="关"
  active-color="#13ce66" inactive-color="#ff4949"
  :active-value="1" :inactive-value="0" />
```

### Slider 滑块

```vue
<el-slider v-model="value" :min="0" :max="100" :step="10" show-input />
<!-- 范围选择 -->
<el-slider v-model="range" range :marks="{ 0: '0°C', 50: '50°C', 100: '100°C' }" />
```

### Rate 评分

```vue
<el-rate v-model="value" :max="5" allow-half show-text :texts="['极差','失望','一般','满意','惊喜']" />
```

### Upload 上传

```vue
<el-upload action="/api/upload" :headers="headers" :on-success="handleSuccess"
  :before-upload="beforeUpload" :file-list="fileList" list-type="picture"
  accept="image/*" :limit="3" :on-exceed="handleExceed">
  <el-button type="primary">点击上传</el-button>
  <template #tip><div class="el-upload__tip">只能上传 jpg/png 文件</div></template>
</el-upload>
```

### Transfer 穿梭框

```vue
<el-transfer v-model="value" :data="data" :titles="['可选项', '已选项']"
  filterable filter-placeholder="搜索" />
```

### ColorPicker 颜色选择器

```vue
<el-color-picker v-model="color" show-alpha :predefine="predefineColors" />
```

### Cascader 级联选择器

```vue
<el-cascader v-model="value" :options="options" :props="{ checkStrictly: true }"
  clearable filterable />
<!-- options 格式: [{ value, label, children }] -->
```

### TreeSelect 树形选择 (Plus only)

```vue
<el-tree-select v-model="value" :data="treeData" check-strictly
  :render-after-expand="false" filterable />
```

### InputTag 标签输入 (Plus 2.9+)

```vue
<el-input-tag v-model="tags" placeholder="输入后按回车" :max="10" />
```
