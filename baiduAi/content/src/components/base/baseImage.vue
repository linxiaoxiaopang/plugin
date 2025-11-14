<template>
  <el-image
    ref="image"
    :key="finalSrc"
    :class="{ [`base-image--${imgSize}`]: imgSize }"
    :style="imageStyle"
    :src="finalSrc"
    :previewSrcList="finalPreviewSrcList"
    :fit="fit"
    :zIndex="finalZIndex"
    @click="clickHandler"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template #placeholder>
      <slot name="placeholder">
        <div v-loading="loading" class="el-image__placeholder base-image__placeholder"></div>
      </slot>
    </template>
    <template #error>
      <div v-if="loading || !finalShow" v-loading="loading" class="el-image__placeholder"></div>
      <slot v-else name="error">
        <img slot="error" class="el-image__inner base-image__error" :src="errSrc" alt="" />
      </slot>
    </template>
  </el-image>
</template>

<script>
import { PopupManager } from 'element-ui/lib/utils/popup'
import errSrc from '@/assets/images/default.png'
import { getALiCompressUrl } from '@/utils/constant'
import { setPx, validData } from '@/components/avue/utils/util'
import { GetLastPromise } from '@/utils/promise'
import { getScrollContainer, isInContainer, off, on } from 'element-ui/src/utils/dom'
import { isHtmlElement, isString } from 'element-ui/src/utils/types'
import throttle from 'throttle-debounce/throttle'
import { isNumber } from '@/components/avue/utils/validate'

const loadingImg = require('@/assets/images/loading.gif')

export default {
  name: 'BaseImage',
  inheritAttrs: false,
  props: {
    noUseCache: Boolean,
    src: {},
    size: {},
    previewSrcList: Array,
    previewSize: {},
    initialIndex: Number,
    formatSrc: {
      type: Function,
      default: getALiCompressUrl
    },
    fit: {
      default: 'contain'
    },
    imgSize: {
      default: 'mini'
    },
    width: {
      type: String | Number
    },
    height: {
      type: String | Number
    },
    errSrc: {
      type: String,
      default: errSrc
    },
    show: {
      type: Boolean,
      default: true
    },
    lazy: Boolean,
    scrollContainer: {},
    zIndex: {
      type: Number,
      default: 9999
    }
  },
  data() {
    return {
      loading: false,
      finalSrc: '',
      finalPreviewSrcList: [],

      finalLazy: this.lazy,

      zIndexOffset: 0
    }
  },
  computed: {
    wrappedGetThumbnail() {
      const getLastPromise = new GetLastPromise()
      return async (src, size) => {
        // await new Promise(resolve => setTimeout(resolve, 5000))
        if (src instanceof Promise) return src
        return getLastPromise.wait(
          this.formatSrc(src, size, this.noUseCache)
        )
      }
    },

    finalShow() {
      if (this.finalLazy) return false
      return this.show
    },
    finalScrollContainer({ scrollContainer }) {
      if (scrollContainer === 'elTable') return '.el-table__body-wrapper'
      return scrollContainer
    },
    previewList() {
      return {
        previewSize: this.previewSize,
        previewSrcList: this.previewSrcList
      }
    },

    layout({ imgSize }) {
      if (!imgSize || ['normal', 'none'].includes(imgSize)) return {}

      let tmpObj
      if (isNumber(imgSize)) {
        tmpObj = { width: imgSize, height: imgSize }
      } else {
        tmpObj = {
          mini: {
            width: 50,
            height: 50
          },
          small: {
            width: 60,
            height: 60
          },
          medium: {
            width: 80,
            height: 80
          },
          large: {
            width: 208,
            height: 180
          },
          super: {
            width: 500,
            height: 500
          }
        }[imgSize] || {}
      }
      const { width, height } = tmpObj

      return {
        width: validData(this.width, width, 68),
        height: validData(this.height, height, 68)
      }
    },
    imageStyle({ layout }) {
      return { width: setPx(layout.width), height: setPx(layout.height) }
    },

    finalZIndex() {
      return this.zIndex + this.zIndexOffset
    }
  },
  watch: {
    src: {
      handler() {
        this.finalShow && this.loadImage()
      },
      immediate: true
    },
    finalShow: {
      handler(n) {
        n && this.lastShowSrc !== this.src && this.loadImage()
      },
      immediate: true
    },
    show: {
      handler(n) {
        n && this.finalLazy && this.handleLazyLoad()
      },
      immediate: true
    },

    previewList: {
      handler(n) {
        const { previewSrcList, previewSize } = n
        if (!Array.isArray(previewSrcList)) return
        this.finalPreviewSrcList = previewSize ? previewSrcList.map(() => loadingImg) : [...previewSrcList]
      },
      immediate: true
    }
  },
  mounted() {
    this.finalLazy && this.addLazyLoadListener()
  },
  beforeDestroy() {
    this.finalLazy && this.removeLazyLoadListener();
  },
  methods: {
    async loadImage() {
      const { src, size } = this
      this.lastShowSrc = src

      this.loading = true
      this.finalSrc = ''
      this.finalSrc = await this.wrappedGetThumbnail(src, size)
      this.loading = false
    },

    clickHandler() {
      // console.log('clickHandler')
      const { previewSrcList } = this
      if (!previewSrcList) return

      const { previewSize } = this
      if (previewSize) {
        const { finalPreviewSrcList, noUseCache } = this
        previewSrcList.forEach(async (src, index) => {
          // await new Promise(resolve => setTimeout(resolve, 2000))
          src = await this.formatSrc(src, previewSize, noUseCache)
          this.$set(finalPreviewSrcList, index, src)
        })
      }

      this.zIndexOffset = PopupManager.nextZIndex()
      // 打开显示loading效果
      this.$refs.image.clickHandler()
      this.$nextTick(() => {
        const image = this.$refs.image
        const imageViewer = image?.$children.find((child) => {
          return child.$options.name === 'elImageViewer'
        })
        if (!imageViewer) return
        // 改变imageViewer.$el父元素时，会导致imageViewer.$el不能正常移除
        document.body.appendChild(imageViewer.$el)
        // imageViewer.$el移除异常情况处理
        const removeChild = () => {
          document.body.removeChild(imageViewer.$el)
          imageViewer.$destroy()
        }
        image.$once('hook:beforeDestroy', removeChild)
        image.$once('hook:deactivated', removeChild)
        imageViewer.$once('hook:beforeDestroy', () => {
          image.$off('hook:beforeDestroy', removeChild)
          image.$off('hook:deactivated', removeChild)
        })

        const { initialIndex } = this
        isNumber(initialIndex) && (imageViewer.index = initialIndex)
      })
    },

    handleLazyLoad() {
      if (isInContainer(this.$el, this._scrollContainer)) {
        this.finalLazy = false
        this.removeLazyLoadListener()
      }
    },
    async addLazyLoadListener() {
      if (this.$isServer) return;

      const { finalScrollContainer } = this;
      let _scrollContainer = null;

      if (isHtmlElement(finalScrollContainer)) {
        _scrollContainer = finalScrollContainer;
      } else if (isString(finalScrollContainer)) {
        _scrollContainer = document.querySelector(finalScrollContainer);
      } else {
        _scrollContainer = getScrollContainer(this.$el);
      }

      if (_scrollContainer) {
        if (finalScrollContainer === '.el-table__body-wrapper') {
          let count = 0
          const isSetHeight = async () => {
            if (count >= 4) return
            if (!_scrollContainer.style.height) {
              count++
              await this.$nextTick(isSetHeight)
            }
          }
          await isSetHeight()
        }

        this._scrollContainer = _scrollContainer;
        this._lazyLoadHandler = throttle(200, this.handleLazyLoad);
        on(_scrollContainer, 'scroll', this._lazyLoadHandler);
        this.handleLazyLoad();
      }
    },
    removeLazyLoadListener() {
      const { _scrollContainer, _lazyLoadHandler } = this;

      if (this.$isServer || !_scrollContainer || !_lazyLoadHandler) return;

      off(_scrollContainer, 'scroll', _lazyLoadHandler);
      this._scrollContainer = null;
      this._lazyLoadHandler = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.base-image {
  display: inline-block;
}
.el-image {
  width: 100%;
  height: 100%;
}
//::v-deep {
//  .el-image__inner {
//    mix-blend-mode: multiply; // 会导致部分图片不显示
//  }
//}
</style>
