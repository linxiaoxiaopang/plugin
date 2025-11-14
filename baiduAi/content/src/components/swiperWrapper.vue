<template>
  <div :class="['swiper-container', customClass]">
    <swiper :class="['swiperWrapperComponent']" ref="mySwiper" v-bind="$attrs" :options="swiperOptions">
      <swiper-slide
        :style="slideStyle"
        v-for="(item, indx) in swiperData"
        :key="indx"
        @click.native.stop="clickHandler(indx)"
      >
        <slot
          v-if="!Array.isArray(item)"
          :scoped="{
            ...item,
            indx
          }"
        />
        <slot v-else :scoped="item"/>
      </swiper-slide>
      <div v-show="hideOnSinglePage" class="swiper-pagination" slot="pagination"></div>
    </swiper>
    <div
      v-show="showSwiperBtn"
      :class="[navigation.nextEl && navigation.nextEl.slice(1), swiperButtonClassNameList.next]"
      @click.capture="slidePrev"
    ></div>
    <div
      v-show="showSwiperBtn"
      :class="[navigation.prevEl && navigation.prevEl.slice(1), swiperButtonClassNameList.prev]"
      @click.capture="slideNext"
    ></div>
  </div>
</template>

<script>
import { waitTimeByNum } from '@/utils'

function createDefaultOption() {
  const that = this //swiper的this指向自己的实例， 重置将vue的this 赋值给$this
  const { mode } = that
  const startDefaultOption = {
    loop: false,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    on: {
      slideChange: function () {
        that.slideChangeHandler(this)
      },
      init: function () {
        that.lock = false //在初始化之前防止触发slideChangeHandler方法
      }
    }
  }

  if (mode === 'custom') {
    startDefaultOption.navigation.disabledClass = 'default-swiper-button-disabled'
  }
  return startDefaultOption
}

export default {
  props: {
    value: {
      type: [Number, String],
      default: 0
    },

    mode: {
      default: 'default'
    },

    max: {
      type: Number,
      default: 0
    },

    customClass: String,

    isActive: Boolean,

    slideStyle: {
      type: Object,
      default: () => ({})
    },

    swiperData: {
      type: Array,
      default: () => []
    },

    defaultSwiperOptions: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      isMounted: false,
      lock: false,
      currentValue: isNaN(+this.value) ? 0 : this.value,
      swiperOptions: {
        ...createDefaultOption.call(this),
        ...this.defaultSwiperOptions
      }
    }
  },

  watch: {
    value(newVal) {
      if (!this.isMounted) return
      this.currentValue = newVal
      this.swiper.slideTo(newVal, 200, false)
    },

    currentValue(newVal) {
      this.$emit('input', newVal)
    }
  },

  computed: {
    swiper({ isMounted }) {
      if (!isMounted) return null
      return this.$refs.mySwiper.$swiper
    },

    swiperButtonClassNameList({ mode, currentValue, swiperData }) {
      if (mode === 'default') return {}
      const tmpObj = {}
      if (currentValue == 0) tmpObj.prev = 'swiper-button-disabled'
      if (currentValue == swiperData.length - 1) tmpObj.next = 'swiper-button-disabled'
      return tmpObj
    },

    navigation({ swiperOptions }) {
      return swiperOptions.navigation || {}
    },

    showSwiperBtn({ swiperOptions, max, swiperData }) {
      const { slidesPerView } = swiperOptions
      const maxNum = (max || slidesPerView || 0)
      if (maxNum === 'auto') return true
      return !!(swiperData.length >= maxNum)
    },

    hideOnSinglePage({ swiperData }) {
      return swiperData.length >= 1
    }
  },

  created() {
    this.lock = true
  },

  mounted() {
    this.isMounted = true
    waitTimeByNum(20).then(() => {
      const swiper = this.swiper
      swiper.navigation?.$nextEl?.off('click', swiper.navigation.onNextClick)
      swiper.navigation?.$prevEl?.off('click', swiper.navigation.onPrevClick)
    })
  },

  methods: {
    slidePrev() {
      if (this.currentValue == this.swiperData.length - 1) return
      this.currentValue++
      this.slideToByValue()
    },

    slideNext() {
      if (this.currentValue == 0) return
      this.currentValue--
      this.swiper.slideTo(this.currentValue, 200, false)
      this.slideToByValue()
    },

    clickHandler(index) {
      const swiper = this.swiper
      this.$emit('input', index)
      this.$emit('swiperClickHandler', swiper)
    },

    slideChangeHandler(swiper) {
      if (this.lock) return
      this.currentValue = swiper.activeIndex
      this.$emit('slideChangeHandler', swiper)
    },

    slideToByValue(value) {
      value = value || this.currentValue
      this.swiper.slideTo(value, 200, false)
    }
  }
}
</script>

<style lang="scss" scoped>
.swiper-container {
  width: 100%;
  height: 100%;

  ::v-deep {
    .swiper-button-disabled.swiper-button-disabled {
      opacity: 0.5;
    }

    .swiper-button-prev,
    .swiper-button-next {
      font-weight: 600;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #fff;
      opacity: 1;
    }

    .swiper-button-prev:after,
    .swiper-button-next:after {
      font-size: $text-mini;
      color: #000;
    }
  }

  .swiperWrapperComponent {
    box-sizing: border-box;
    cursor: pointer;
  }

  :focus {
    outline: none;
  }
}
</style>
