<template>
  <appDialog
    customClass="font-disclaimer-tip"
    btnType="text"
    title="《免责声明》"
  >
    <div v-html="disclaimer"></div>
  </appDialog>
</template>

<script>

export default {
  data() {
    return {
      // todo 等产品提供
      disclaimer: '',
    }
  }
}
</script>

<style lang="scss">
.font-disclaimer-tip{
  .el-dialog__body{
    margin-top: 20px;
  }
}

</style>
