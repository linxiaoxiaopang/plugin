<template functional>
  <div class="base-image flex-middle" :class="[data.staticClass, data.class]" :title="data.attrs && data.attrs.title">
    <BaseImage
      style="flex-shrink: 0"
      :is="props.componentName || 'BaseImage'"
      :style="[data.staticStyle, ...(Array.isArray(data.style) ? data.style : [data.style])]"
      :imgSize="props.imgSize || 'mini'"
      v-bind="props"
    ></BaseImage>
    <div
      class="base-image__content"
      :class="[
        `content-position--${props.contentPosition || 'center'}`,
        {
          [`img-size-${props.imgSize}`]: props.imgSize
        }
      ]"
      :style="{ height: `${props.imgSize}px` }"
    >
      <slot>
        <el-tooltip class="item" effect="dark" :content="`${props.text || '暂无' }`" placement="top">
          <span class="text-wrapper">{{ props.text || '暂无' }}</span>
        </el-tooltip>
      </slot>
    </div>
  </div>
</template>

<script>
// export default {
//   functional: true,
//   render(createElement, ctx) {
//     console.log(ctx)
//     const { data, props, listeners, parent, scopedSlots } = ctx
//     return (
//       <div class={ [data.staticClass, data.class, 'base-image flex-middle'] }>
//         <defaultImg
//           src={ props.src }
//           style={ [data.staticStyle, data.style, { 'flex-shrink': 0 }] }
//           imgSize={ props.size || 'mini' }
//           { ...props }
//         ></defaultImg>
//         <div class="ml20" style="max-width: 200px">{ scopedSlots.default ? scopedSlots.default() : props.text }</div>
//       </div>
//     )
//   }
// }
</script>

<style lang="scss">
.base-image {
  &[title] {
    position: relative;
    &::after {
      @include circle;
      content: attr(title);
      position: absolute;
      top: 11px;
      right: 0;
      transform: translate(50%, -50%);
    }
    .el-image {
      margin-top: 11px;
    }
  }

  img {
    mix-blend-mode: multiply;
  }
  .base-image__content {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 50px;
    line-height: 1;
    padding-left: 20px;
    overflow: hidden;
    &.img-size-small {
      height: 70px;
    }
    .text-wrapper {
      @include ellipsis(2)
    }
  }

  .content-position--center {
    justify-content: center;
  }
  .content-position--between {
    justify-content: space-between;
  }
}
</style>
