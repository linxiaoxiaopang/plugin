<template functional>
  <el-image
    :src="parent.parseImgSrc(props.src)"
    :fit="props.fit || 'contain'"
    :class="[data.staticClass, data.class, { [`el-image--${props.size}`]: props.size }]"
    :style="[data.staticStyle, data.style]"
    v-on="listeners"
  >
    <template #error>
      <slot name="error">
        <img src="@/assets/images/default.png" alt="" class="el-image__inner" />
      </slot>
    </template>
  </el-image>
</template>

<style lang="scss">
.el-image {
  &.el-image--mini {
    width: 50px;
    height: 50px;
  }
}
</style>