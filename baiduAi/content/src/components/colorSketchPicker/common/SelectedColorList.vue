<template>
  <div class="vc-sketch-presets" role="group" aria-label="A color preset, pick one to set as current color">
    <div class="vc-sketch-presets-title">已选颜色</div>
    <div class="vc-sketch-presets-list">
      <template v-for="(c, index) in selectedColors">
        <div class="vc-sketch-presets-color-large_wrapper">
          <i class="del-icon iconfont icon-close" @click="delHandler(c, index)"></i>
          <div
            class=" vc-sketch-presets-color-large"
            :aria-label="'Color:' + c"
            :key="c"
            :style="{ background: c }"
          ></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>

export default {
  props: {
    selectedColors: {
      type: Array,
      default: () => []
    }
  },

  methods: {
    delHandler(...args) {
      this.$emit('del-color', ...args)
    }
  }
}
</script>

<style lang="scss" scoped>
.vc-sketch-presets-color-large_wrapper {
  position: relative;
  margin: 0 10px 16px 0;
  border: 1px solid $color-background--extensive;
  border-radius: 2px;
}

.vc-sketch-presets-color-large_wrapper:hover {
  .del-icon {
    display: inline-block;

  }
}

.vc-sketch-presets-color-large_wrapper:nth-child(6n) {
  margin-right: 0;
}

.vc-sketch-presets-color-large {
  width: 56px;
  height: 56px;
}

.del-icon {
  position: absolute;
  top: -13px;
  right: -10px;
  display: none;
  font-size: 12px;
  transform: scale(0.6);
  width: 25px;
  height: 25px;
  text-align: center;
  line-height: 25px;
  cursor: pointer;
  border-radius: 50%;
  color: #fff;
  background: $color-danger;
}
</style>
