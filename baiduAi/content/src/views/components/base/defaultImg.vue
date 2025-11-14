<template>
  <!-- Number(lWidth) + 24：限制el-scrollbar滚动宽度 -->
  <el-popover
    v-if="isShowImg"
    :placement="placement"
    :trigger="trigger"
    :width="Number(lWidth) + 24"
    :visible-arrow="false"
    :disabled="disabled"
    class="default-img-popover-wrapper"
    :class="{'is-center': align === 'center', h100: height === '100%', w100: width === '100%'}"
    :style="{
      width: setPx(Number(width) + (isShowCarousel ? 56 : 0)),
      height: setPx(height)
    }"
    v-bind="popoverAttrs"
  >
    <slot name="tip">
      <p v-if="content" class="default-img-popover-tip">{{ content }}</p>
    </slot>
    <el-image
      :fit="fit"
      :src="lSrc"
      :style="{
        width: setPx(lWidth),
        height: setPx(lHeight)
      }"
      :z-index="9999"
    >
      <slot name="defaultImg">
        <img slot="error" :src="errSrc" :width="lWidth" :height="lHeight" alt="" class="el-image__inner" />
      </slot>
    </el-image>
    <el-scrollbar v-if="cSrcList.length" ref="scrollbar" class="x-scroll mt10">
      <el-image
        v-for="(item) in cSrcList"
        :key="item"
        :fit="fit"
        :src="item"
        :style="{
          width: setPx(cWidth),
          height: setPx(cHeight)
        }"
        class="cItem"
        :class="{ cActive: lSrc === item }"
        :z-index="9999"
        @click.native="lSrc = item"
      >
        <slot name="cDefaultImg">
          <img slot="error" :src="errSrc" :width="cWidth" :height="cHeight" alt="" class="el-image__inner" />
        </slot>
      </el-image>
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
          :autoplay="false"
          :loop="false"
          :height="setPx(height)"
          :style="{ width: setPx(Number(width) + 56) }"
        >
          <el-carousel-item v-for="(item, index) in carouselSrcList" :key="index">
            <el-image
              :key="item"
              :src="item"
              :style="{
                width: setPx(width),
                height: setPx(height)
              }"
              :fit="fit"
              class="default-img"
              :z-index="9999"
              @load="onload"
              @error="onerror"
              @click.native="carouselItemClick"
            >
              <slot name="defaultImg">
                <img slot="error" :src="errSrc" :width="width" :height="height" alt="" class="el-image__inner" />
              </slot>
            </el-image>
          </el-carousel-item>
        </el-carousel>
        <!-- el-carousel__item 使用了transform导致子元素el-image的fixed失效，el-image的preview-src-list无法展示完全 -->
        <el-image ref="carouselPreviewSrcList" class="carouselPreviewSrcList" :src="lSrc" :preview-src-list="srcList"></el-image>
      </template>
      <template v-else>
        <el-image
          v-show="!loading"
          :src="curSrc"
          :preview-src-list="srcList"
          :style="{
            width: setPx(width),
            height: setPx(height)
          }"
          :fit="fit"
          class="default-img"
          :z-index="9999"
          @load="onload"
          @error="onerror"
        >
          <slot name="defaultImg">
            <img slot="error" :src="errSrc" :width="width" :height="height" alt="" class="el-image__inner" />
          </slot>
        </el-image>
        <div
          v-if="loading"
          :style="{
            width: setPx(width),
            height: setPx(height)
          }"
          v-loading="true"
        ></div>
      </template>
      <div v-if="$slots.referenceFooter" class="reference-footer">
        <slot name="referenceFooter"></slot>
      </div>
    </template>
  </el-popover>
  <div
    v-else
    :style="{
      width: setPx(width),
      height: setPx(height)
    }"
    v-loading="true"
  ></div>
</template>
<script>
import errSrc from '@/assets/images/default.png'
import { getThumbnail } from '@/utils/constant'
import { setPx } from '@/components/avue/utils/util'

export default {
  props: {
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
    errSrc: {
      type: String,
      default: errSrc
    },
    size: String | Number,
    cSize: String,
    previewSrcList: Array,
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
    content: {
      type: String,
      default: '图片'
    },
    placement: {
      type: String,
      default: 'right'
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
    }
  },
  data() {
    return {
      curSrc: '',
      lSrc: '',
      loading: false,
      loaded: false,
      cSrcList: [],

      carouselSrcList: []
    }
  },
  computed: {
    popoverAttrs({ popperClass, openDelay }) {
      return {
        openDelay,
        popperClass: `default-img-popover ${popperClass}`
      }
    },

    isShowImg({ loaded, src, isShowCarousel, isSrcList }) {
      return loaded || (!src && !isShowCarousel && !isSrcList)
    },

    srcList({ previewSrcList, preview, curSrc, value, previewProp }) {
      previewSrcList = previewSrcList || value[previewProp]
      if (previewSrcList) return previewSrcList
      if (preview) return [curSrc]
    },
    cSrcListParams({ cSize, size, imgList }) {
      return {
        cSize: cSize || size,
        imgList
      }
    },
    isSrcList() {
      return !!this.imgList.length
    },

    finalCarouselList({ carouselList, value, carouselProp }) {
      return carouselList || value[carouselProp] || []
    },
    isShowCarousel({ isCarousel, finalCarouselList }) {
      return isCarousel || finalCarouselList.length
    },
    carouselListParams({ carouselSize, size, finalCarouselList }) {
      return {
        size: carouselSize || size,
        imgList: finalCarouselList
      }
    }
  },
  watch: {
    src: {
      async handler(n) {
        this.loading = true
        this.curSrc = await this.getThumbnail(n, this.size)
        if (n) {
          // 等待图片加载完成
          this.loaded = true
        }
      },
      immediate: true
    },
    curSrc: {
      handler(n) {
        this.lSrc = n
      },
      immediate: true
    },

    cSrcListParams: {
      handler(n) {
        let { cSize, imgList } = n
        imgList.forEach(async (src, index) => {
          src = this.getThumbnail(src, cSize)
          if (index === 0) {
            this.loading = true
            this.curSrc = await src
            this.loaded = true
            this.loading = false
          }
          this.$set(this.cSrcList, index, await src)
        })
      },
      immediate: true,
      deep: true
    },

    carouselListParams: {
      handler(n) {
        let { size, imgList } = n
        imgList.forEach(async (src, index) => {
          this.$set(this.carouselSrcList, index, await this.getThumbnail(src, size))
          if (index === 0) {
            this.lSrc = this.carouselSrcList[index]
          }
          // 第一个图片加载完成时，停止loading
          this.loaded = true
        })
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    setPx,
    async getThumbnail(src, size) {
      if (!src) return ''
      src = this.parseImgSrc(src)
      if (!size) {
        return src
      } else {
        if (src.includes('?')) return src
        let res = await getThumbnail(src, size)
        return res || src
      }
    },

    onload() {
      this.loading = false
      this.$emit('load')
    },
    onerror() {
      this.loading = false
      this.$emit('error')
    },

    carouselChange(nIndex, oIndex) {
      // console.log(nIndex, oIndex)
      this.lSrc = this.carouselSrcList[nIndex]
    },
    carouselItemClick() {
      this.$refs.carouselPreviewSrcList.clickHandler()
    },

    moveScrollbar() {
      console.log('moveScrollbar')
      this.$refs.scrollbar.wrap.scrollLeft += 10
    }
  }
}
</script>

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
  .carouselPreviewSrcList {
    position: absolute;
    width: 0;
    height: 0;
    margin: auto;
  }
}
.default-img-popover {
  .el-scrollbar__wrap {
    margin-bottom: -12px !important;
  }
  .el-scrollbar__view {
    .el-image + .el-image {
      margin-left: 10px;
    }
  }
  .cItem {
    border: 1px solid #FFFFFF;
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
    color: #7F8792;
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
