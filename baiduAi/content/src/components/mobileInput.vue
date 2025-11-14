<template>
  <!-- 手机input输入框 -->
  <el-input
    ref="input"
    class="mobile-input-component"
    v-bind="$attrs"
    v-on="$listeners"
    clearable
    :type="$attrs.type || 'text'"
    :placeholder="$attrs.placeholder || '请输入手机号'"
  >
    <template slot="prepend"> <span> +86 </span></template>
  </el-input>
</template>

<style lang="scss" scoped>
.mobile-input-component {
  position: relative;
  ::v-deep {
    .el-input-group__prepend {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      left: 1px;
      top: 25%;
      width: 80px;
      height: 50%;
      background: transparent;
      border: none;
      border-right: 1px solid #eee;
    }

    .el-input__inner {
      padding-left: 95px;
      border-radius: 4px;
    }
  }
}
</style>
