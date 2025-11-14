<template>
  <i 
    v-if="isPic"
    :class="[customClass]"
    :style="{
      'background-image': `url(${loveIconSrc})`
    }"
  ></i>
  <svg-icon v-else :class="[customClass]" :icon-class="data.collect ? 'xiai' : 'aixin'"></svg-icon>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true
    },

    customClass: {
      type: String,
      default: ''
    },

    isPic: Boolean
  },

  computed: {
    loveIconSrc({ data }) {
      if (data.collect) {
        return require('@/assets/images/icon-shejiqi_weishoucang.png')
      }
      return require('@/assets/images/icon-shejiqi_yishoucang.png')
    }
  }
}
</script>

<style lang="scss" scoped>
.love {
  position: absolute;
  right: 10px;
  top: 8px;
  z-index: 10;
  width: 32px;
  height: 32px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  opacity: 0.8;
  border-radius: 4px;
}
</style>