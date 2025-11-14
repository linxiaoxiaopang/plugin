<template functional>
  <div class="list-state-group" :style="data.staticStyle" :class="data.staticClass">
    <el-radio-group :value="props.value" v-on="listeners">
      <el-radio-button v-for="({ label, value }, index) in props.list" :label="value" :key="index">
        {{ label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>
<style lang="scss">
.list-state-group {
  .el-radio-button__inner {
    width: 140px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f8fa;
  }
  .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    color: #3841db;
    background: #f7f8fa;
    font-weight: 500;
    border: 1px solid #dcdee0;
    transition: none;
    // border-right: 1px solid #dcdee0;
    // border-left: 1px solid #dcdee0;
    // border-bottom: 3px solid #3841db;
    box-shadow: none;
  }
  .el-radio-button__orig-radio:checked + .el-radio-button__inner::before {
    content: '';
    position: absolute;
    height: 2px;
    width: calc(100% + 2px);
    background: #3841db;
    bottom: 0;
  }
  .el-radio-button:focus:not(.is-focus):not(:active):not(.is-disabled),
  .el-radio-button.is-active {
    box-shadow: none;
    border-left-color:#dcdee0;
  }
}
</style>