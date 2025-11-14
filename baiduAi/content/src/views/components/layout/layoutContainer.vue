<!--<template functional>
  <el-row class="layout-container" :class="[data.staticClass]" :gutter="props.gutter === undefined ? 40 :　props.gutter">
    <el-col class="layout-container__left" :style="{ width: props }">
      <slot name="left"></slot>
    </el-col>
    <el-col class="layout-container__right">
      <slot name="right">
        <slot></slot>
      </slot>
    </el-col>
  </el-row>
</template>-->

<script>
import { setPx, validData } from '@/components/avue/utils/util'

export default {
  functional: true,
  render(h, { props: { width, gutter, flex = 'row' }, scopedSlots, data }) {
    let leftTemplate = scopedSlots.left?.()
    let rightTemplate = (scopedSlots.right || scopedSlots.default)?.()
    if (['row'].includes(flex)) {
      if ([].concat(leftTemplate).length > 1) {
        leftTemplate = (
          <div class="left-container">{ leftTemplate }</div>
        )
      }
      if ([].concat(rightTemplate).length > 1) {
        rightTemplate = (
          <div class="right-container">{ rightTemplate }</div>
        )
      }
    }
    return (
      <el-row class={ ['layout-container', `flex-scroll--${ flex }`, data.staticClass] } gutter={ validData(gutter, 40) }>
        <el-col class="layout-container__left" style={ { width: setPx(width, 'auto') } }>
          { leftTemplate }
        </el-col>
        <el-col class="layout-container__right">
          { rightTemplate }
        </el-col>
      </el-row>
    )
  }
}
</script>

<style lang="scss">
.flex-scroll--row {
  display: flex;
  overflow: hidden;
  .layout-container__left,
  .layout-container__right {
    display: flex;
    overflow: hidden;
  }
  .layout-container__left {
    width: auto;
  }
  .layout-container__right {
    flex: 1;
  }

  .left-container,
  .right-container {
    display: flex;
    flex-direction: column;
    overflow: auto;
    .scroll__content {
      flex: 1;
      overflow: auto;
    }
  }
}
</style>