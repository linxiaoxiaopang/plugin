<template>
  <!-- Number(lWidth) + 24：限制el-scrollbar滚动宽度 -->
  <base-popover
    ref="popoverRef"
    :placement="placement"
    :trigger="trigger"
    :width="Number(lWidth) + 24"
    :visible-arrow="false"
    :disabled="disabled"
    class="default-img-popover-wrapper"
    :class="{ 'is-center': align === 'center', h100: height === '100%', w100: width === '100%' }"
    :style="popoverStyle"
    v-bind="popoverAttrs"
  >
    <slot name="tip">
      <p v-if="finalContent" class="default-img-popover-tip">{{ finalContent }}</p>
    </slot>
    <base-image
      :fit="fit"
      :size="popoverSize"
      :src="popoverSrc"
      :formatSrc="formatSrc"
      :errSrc="errSrc"
      :width="lWidth"
      :height="lHeight"
      :z-index="zIndex"
      @error="onerror"
    >
      <template slot="error"><slot name="defaultImg"></slot></template>
    </base-image>
    <el-scrollbar v-if="isImgList" ref="scrollbar" class="x-scroll mt10">
      <base-image
        v-for="item in finalImgList"
        :key="item"
        :fit="fit"
        :size="finalImgSize"
        :src="item"
        :formatSrc="formatSrc"
        :errSrc="errSrc"
        :width="cWidth"
        :height="cHeight"
        class="cItem"
        :class="{ cActive: lSrc === item }"
        :z-index="zIndex"
        @click.native="lSrc = item"
        @error="onerror"
      >
        <template slot="error"><slot name="defaultImg"></slot></template>
      </base-image>
    </el-scrollbar>
    <div v-if="$slots.footer" class="popover-footer">
      <slot name="footer"></slot>
    </div>


    <template slot="reference">
      <template v-if="isShowCarousel">
        <el-carousel
          @change="carouselChange"
          class="default-img-carousel"
          indicator-position="none"
          arrow="always"
          :initialIndex="initialIndex"
          :autoplay="false"
          :loop="false"
          :height="setPx(height)"
          :style="{ width: popoverStyle.width }"
        >
          <el-carousel-item v-for="(item, index) in finalCarouselList" :key="index">
            <base-image
              v-if="showCarouselList[index]"
              :size="finalCarouselSize"
              :src="item"
              :formatSrc="formatSrc"
              :errSrc="errSrc"
              :width="width"
              :height="height"
              :fit="fit"
              class="default-img"
              :class="{ 'cursor-zoom-in': isPreviewSrcList }"
              :z-index="zIndex"
              :lazy="lazy"
              :scrollContainer="scrollContainer"
              :initial-index="index"
              :previewSize="finalPreviewSize"
              :preview-src-list="finalPreviewSrcList"
              @load="onload"
              @error="onerror"
            >
              <template slot="error"><slot name="defaultImg"></slot></template>
            </base-image>
          </el-carousel-item>
        </el-carousel>
      </template>
      <span v-else>
        <base-image
          :size="finalSize"
          :src="finalSrc"
          :formatSrc="formatSrc"
          :errSrc="errSrc"
          :previewSize="finalPreviewSize"
          :preview-src-list="finalPreviewSrcList"
          :width="width"
          :height="height"
          :fit="fit"
          class="default-img"
          :z-index="zIndex"
          :lazy="lazy"
          :scrollContainer="scrollContainer"
          @load="onload"
          @error="onerror"
        >
          <template slot="error"><slot name="defaultImg"></slot></template>
        </base-image>
      </span>

      <div v-if="$slots.referenceFooter" class="reference-footer">
        <slot name="referenceFooter"></slot>
      </div>
    </template>
  </base-popover>
</template>
<script>
import basePopover from '@/views/components/basePopover'
import { setPx } from '@/components/avue/utils/util'
import { getALiCompressUrl } from '@/utils/constant'
import { set, get } from 'lodash'

export default {
  inheritAttrs: false,
  components: { basePopover },
  props: {
    noUseCache: Boolean,
    disabled: Boolean,
    trigger: {
      type: String,
      default: 'hover'
    },
    popperClass: {
      type: String,
      default: ''
    },
    openDelay: Number,
    align: {
      type: String,
      default: 'center'
    },
    src: {
      type: String,
      default: ''
    },
    imgList: {
      type: Array,
      default: () => []
    },
    errSrc: String,
    size: {
      type: String | Number,
      default: 80
    },
    cSize: String,
    //trigger之后展示的图片
    popoverPicSize: {
      type: String | Number,
      default: 'force__700'
    },
    previewSrcList: Array,
    previewSize: {
      type: String | Number,
      default: 'force__origin'
    },
    preview: {
      type: Boolean,
      default: false
    },
    width: {
      type: String | Number,
      default: '68'
    },
    height: {
      type: String | Number,
      default: '68'
    },
    lWidth: {
      type: String | Number,
      default: '460'
    },
    lHeight: {
      type: String | Number,
      default: '460'
    },
    cWidth: {
      type: String | Number,
      default: '64'
    },
    cHeight: {
      type: String | Number,
      default: '64'
    },
    fit: {
      type: String,
      default: 'contain'
    },
    placement: {
      type: String,
      default: 'right'
    },
    content: {
      type: String,
      default: '图片'
    },
    contentList: {
      type: Array,
      default: () => []
    },

    isCarousel: Boolean,
    carouselList: Array,
    carouselSize: String,

    value: {
      type: Object,
      default: () => ({})
    },
    carouselProp: {
      type: String,
      default: 'carouselList'
    },
    previewProp: {
      type: String,
      default: 'previewSrcList'
    },

    lazy: Boolean,
    scrollContainer: {},
    keepCarouseIndex: Boolean,
    zIndex: {
      type: Number,
      default: 9999
    }
  },
  data() {
    return {
      initialIndex: 0,
      lSrc: '',
      showCarouselList: []
    }
  },
  computed: {
    type() {
      if (this.src) return 'src'
      if (this.hasCarousel) return 'carousel'
      if (this.isImgList) return 'scrollbar'
    },
    finalSrc() {
      return this.src || this.finalCarouselList[0] || this.finalImgList[0]
    },
    finalSize() {
      return {
        src: this.size,
        carousel: this.finalCarouselSize,
        scrollbar: this.finalImgSize
      }[this.type]
    },

    popoverAttrs({ popperClass, openDelay }) {
      return {
        openDelay,
        popperClass: `default-img-popover ${popperClass}`
      }
    },

    popoverSrc() {
      return this.lSrc || this.src || (this.lSrc = this.finalImgList?.[0])
    },
    popoverSize() {
      return this.popoverPicSize || this.size
    },
    popoverStyle() {
      return {
        width: setPx(Number(this.width) + (this.hasCarousel ? 56 : 0)),
        height: setPx(this.height)
      }
    },

    isImgList() {
      return !!this.finalImgList.length
    },
    finalImgList() {
      return this.imgList
    },
    finalImgSize() {
      return this.cSize || this.size
    },

    isPreviewSrcList() {
      return this.finalPreviewSrcList.length > 0
    },
    finalPreviewSrcList({ previewSrcList, value, previewProp }) {
      previewSrcList = previewSrcList || value[previewProp]
      if (previewSrcList) return previewSrcList
      if (this.preview) {
        if (this.hasCarousel) return this.finalCarouselList
        return [this.src]
      }
      return []
    },
    finalPreviewSize({ previewSize }) {
      if (previewSize) return previewSize
      if (this.previewSrcList) return
      return this.finalSize
    },

    isShowCarousel({ finalCarouselList }) {
      return finalCarouselList.length > 1
    },
    hasCarousel() {
      return this.isCarousel || this.finalCarouselList.length
    },
    finalCarouselList() {
      return this.carouselList || this.value[this.carouselProp] || []
    },
    finalCarouselSize() {
      return this.carouselSize || this.size
    },

    finalContent() {
      return this.contentList[this.initialIndex] || this.content
    }
  },
  watch: {
    finalCarouselList: {
      handler(n) {
        if(!this.keepCarouseIndex) {
          this.initialIndex = 0
        }
        this.lSrc = n?.[this.initialIndex]
        const temArr = []
        temArr[this.initialIndex] = true
        this.showCarouselList = temArr
      },
      immediate: true
    }
  },

  methods: {
    carouselChange(nIndex) {
      // console.log(nIndex, oIndex)
      this.initialIndex = nIndex
      this.lSrc = this.finalCarouselList[nIndex]
      this.$set(this.showCarouselList, nIndex, true)
    },

    onload() {
      this.$emit('load')
    },
    onerror() {
      this.$emit('error')
    },

    setPx,
    formatSrc(src, size) {
      if (Array.isArray(src)) return src.map(item => this.formatSrc(item, size))

      const path = ['cacheSrc', `size-${size}`, src]
      let value = get(this, path)
      if (value) return value

      value = getALiCompressUrl(src, size, this.noUseCache)
      set(this, path, value)
      if (value instanceof Promise) value.then(res => set(this, path, res))

      return value
    }
  }
}
</script>

<style lang="scss" scoped>
.default-img-popover-wrapper.text-right {
  display: flex;
  align-items: center;
  width: auto !important;
  .el-popover__reference {
    display: block;
    height: 100%;
  }
  .reference-footer {
    margin-left: 10px;
  }
}

.cursor-zoom-in {
  cursor: zoom-in;
}
</style>
<style lang="scss">
.default-img-popover-tip+.el-image {
  background: #f4f6f7;
  img {
    mix-blend-mode: multiply;
  }
}
.default-img-popover-wrapper {
  .el-image {
    background: #f4f6f7;
    img {
      mix-blend-mode: multiply;
    }
  }
  &.is-center {
    display: block;
    text-align: center;
  }
  &.h100 {
    height: 100%;
    .el-popover__reference-wrapper {
      height: 100%;
    }
  }
  &.w100 {
    width: 100%;
  }
}
.default-img-popover {
  .el-scrollbar__wrap {
    margin-bottom: -12px !important;
  }
  .el-scrollbar__view {
    .base-image + .base-image {
      margin-left: 10px;
    }
  }
  .cItem {
    border: 1px solid #ffffff;
    border-radius: 4px;
    &.cActive {
      border-color: #000000;
    }
  }
}
.default-img-carousel {
  .el-carousel__item {
    text-align: center;
  }
  .el-carousel__arrow {
    width: 20px;
    height: 20px;
    color: #7f8792;
    background-color: transparent;
    font-size: 18px;
  }
  .el-carousel__arrow--left {
    left: 0;
  }
  .el-carousel__arrow--right {
    right: 0;
  }
}
.default-img {
  .el-image__inner {
    display: block;
    object-fit: contain;
  }
  .el-image__preview {
    cursor: zoom-in;
  }
}
.x-scroll {
  width: 100%;
  white-space: nowrap;
}
</style>
