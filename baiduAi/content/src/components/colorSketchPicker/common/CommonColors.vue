<template>
  <div class="vc-sketch-presets" role="group" aria-label="A color preset, pick one to set as current color">
    <div class="vc-sketch-presets-title">常用颜色</div>
    <div class="vc-sketch-presets-list">
      <template v-for="c in presetColors">
        <div
          v-if="!isTransparent(c)"
          class="vc-sketch-presets-color-medium"
          :aria-label="'Color:' + c"
          :key="c"
          :style="{ background: c }"
          @click="handlePreset(c)"
        ></div>
        <div v-else :key="c" :aria-label="'Color:' + c" class="vc-sketch-presets-color-medium" @click="handlePreset(c)">
          <checkboard/>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import checkboard from './Checkboard.vue'
import tinycolor from 'tinycolor2'

export default {
  components: {
    checkboard
  },

  props: {
    presetColors: {
      type: Array,
      default: () => []
    }
  },

  methods: {
    handlePreset(c) {
      this.$emit('handlePreset', c)
    },

    isTransparent(color) {
      return tinycolor(color).getAlpha() === 0
    }
  }
}
</script>

<style lang="scss" scoped>
.vc-sketch-presets-color-medium {
  width: 22px;
  height: 22px;
  border-radius: 1px;
  cursor: pointer;
  border: 1px solid $color-background--extensive;
}

.vc-sketch-presets-color-medium:hover {
  border-color: $color-primary;
}

.vc-sketch-presets-color-medium + .vc-sketch-presets-color-medium {
  margin-left: 10px;
}
</style>
