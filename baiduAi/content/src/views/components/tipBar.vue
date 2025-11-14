<template>
  <el-alert v-bind="$attrs" v-on="$listeners" :class="[borderColorClass]">
    <template #title>
      <slot></slot>
    </template>
  </el-alert>
</template>

<script>
export default {
  computed: {
    borderColorClass() {
      switch (this.$attrs.type) {
        case 'warning':
          return 'warning-class'
        case 'success':
          return 'success-class'
        case 'error':
          return 'error-class'
        default:
          return 'info-class'
      }
    }
  }
}
</script>

<style scoped lang="scss">
//.el-alert {
//  border-width: 2px;
//  border-style: solid;
//}
//.warning-class {
//  border-color: $--color-warning;
//}
//.info-class {
//  border-color: $--color-info;
//}
//.success-class {
//  border-color: $--color-success;
//}
//.error-class {
//  border-color: $--color-danger;
//}
::v-deep {
  .el-alert__title {
    color: $color-gray;
  }
}
</style>
