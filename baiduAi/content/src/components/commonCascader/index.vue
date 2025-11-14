<template>
  <el-cascader
    ref="cascader"
    popper-class="common-cascader-component"
    :props="Object.assign(commonProps, keyProps)"
    :show-all-levels="!!$attrs['show-all-levels']"
    :clearable="clearable"
    :placeholder="$attrs.placeholder || '请选择分类'"
    :options="options"
    :size="$attrs.size || 'mini'"
    :value="$attrs.value"
    v-bind="$attrs"
    v-on="$listeners"
    @change="handleChange"
  ></el-cascader>
</template>
<script>
export default {
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    options: {
      type: Array,
      required: true
    },

    commonProps: {
      type: Object,
      default: () => ({
        checkStrictly: true,
        expandTrigger: 'hover',
        emitPath: false
      })
    },

    keyProps: {
      type: Object,
      default: () => ({
        value: 'id',
        label: 'name'
      })
    },

    clearable: {
      type: Boolean,
      default: true
    }
  },

  methods: {
    handleChange(val) {
      this.$emit('update:value', val)
      // 数据变化后收起下拉菜单
      this.$refs.cascader.dropDownVisible = false
    }
  }
}
</script>

<style lang="scss">
.common-cascader-component {
  .el-cascader-panel .el-radio {
    width: 100%;
    height: 100%;
    z-index: 10;
    position: absolute;
    top: 0px;
    right: 0px;
  }
  .el-cascader-panel .el-radio__input {
    visibility: hidden;
  }
  .el-cascader-node:not(.is-disabled):focus, .el-cascader-node:not(.is-disabled):hover {
    color: $color-primary;
    background: transparent;
  }
  .el-cascader-node.in-active-path, .el-cascader-node.is-active, .el-cascader-node.is-selectable.in-checked-path {
    font-weight: 400;
  }
  .is-active.is-active.is-active {
    background-color: $menuHover;
    color: $color-primary;
  }

}
</style>
