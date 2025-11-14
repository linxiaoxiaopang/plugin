<template functional>
  <span v-if="props.trigger === 'icon'" :uiid="data.attrs.uiid">
    <slot></slot>
    <i class="el-icon-document-copy" style="margin-left: 5px; cursor: pointer;" v-copy="props.value"></i>
  </span>
  <el-popover
    v-else
    placement="right"
    trigger="hover"
    popper-class="hoverCopy"
    :uiid="data.attrs.uiid"
  >
    <el-button type="text" v-if="props.value" v-copy="props.value" :key="props.value">复制</el-button>
    <span slot="reference" :class="[data.staticClass, data.class]" :style="[data.staticStyle, data.style]">
      <slot></slot>
    </span>
  </el-popover>
</template>

<style lang="scss">
.el-popover.hoverCopy {
  min-width: auto;
  padding: 0;
  .el-button {
    padding: 8px 12px;
  }
}
</style>
