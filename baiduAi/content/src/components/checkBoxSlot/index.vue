<template functional>
  <el-checkbox class="check-box_slot" :checked="props.checked" :label="props.label" :disabled="props.disabled" v-on="listeners">
    <!--    阻止默认行为-->
    <div v-if="props.prevent" @click.stop.prevent>
      <slot></slot>
    </div>
    <slot v-else></slot>
  </el-checkbox>
</template>

<script>

</script>

<style lang="scss" scoped>
.check-box_slot {
  position: relative;
  display: block;

  ::v-deep {
    .el-checkbox__input {
      position: absolute;
      left: 10px;
      top: 10px;
      z-index: 2;
    }

    .el-checkbox__label {
      display: block;
      padding: 0;
      user-select: text;
    }
  }

}
</style>
