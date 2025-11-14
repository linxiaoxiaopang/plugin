<template>
  <div class="recommendComponent">
    <Swiper
      v-if="data.length"
      v-slot="{ scoped }"
      :isActive="isActive"
      :swiperData="data"
      :defaultSwiperOptions="{
        autoplay: false,
        pagination: false,
        spaceBetween: 10,
        slidesPerView: 6
      }"
    >
      <slot :scoped="scoped"></slot>
    </Swiper>
  </div>
</template>

<script>
import Swiper from '@/components/swiperWrapper'
export default {
  components: {
    Swiper
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    isActive: Boolean
  },
  created() {
    console.log('data', this.data)
  }
}
</script>

<style lang="scss" scoped>
.recommendComponent {
  position: relative;
  ::v-deep {
    .swiper-slide {
      margin: 0 15px;
    }
    .swiper-button-prev,
    .swiper-button-next {
      color: white;
      font-weight: 600;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #dcdee0;
      opacity: 1;
    }
    .swiper-button-disabled {
      opacity: 0.5;
    }
    .swiper-button-prev {
      margin-left: -9px;
    }
    .swiper-button-next {
      margin-right: -9px;
    }
    .swiper-button-prev:after,
    .swiper-button-next:after {
      font-size: 12px;
      color: #fff;
    }
  }
}
</style>
