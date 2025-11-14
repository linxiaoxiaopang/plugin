<template>
  <div class="vc-sketch-presets">
    <div class="vc-sketch-presets-title">自定义颜色</div>
    <div class="vc-sketch-presets-list">
      <template v-for="(c, index) in customColors">
        <div
          class="vc-sketch-presets-color"
          :key="index"
          :style="{ background: c }"
          @click="handlePreset(c)"
        >
          <div class="icon-close-after" />
          <i class="del-color iconfont icon-guanbi1" @click.stop="deleteHandler(index)" />
        </div>
      </template>
      <i class="icon vc-sketch-presets-color  el-icon-plus" @click="addHandler" />
    </div>
  </div>
</template>

<script>
import { LocalCache } from '@/utils'
import { isString } from 'lodash'

function getKey() {
  const cacheColorKey = this.cacheColorKey || ''
  return `${this.$store.getters.id || ''}_${cacheColorKey}_background_color_key`
}

const MAX_COUNT = 5

export default {

  props: {
    colors: {
      required: true
    },

    cacheColorKey: {
      type: String,
      default: ''
    }
  },

  data() {
    const colorCache = new LocalCache({
      maxNum: MAX_COUNT,
      storageKey: getKey.call(this)
    })
    return {
      colorCache,
      customColors: colorCache.getAll()
    }
  },

  methods: {
    addHandler() {
      let color = this.colors
      if (!isString(this.colors)) {
        color = this.colors.hex8
      }
      this.colorCache.add(color)
      this.customColors = this.colorCache.getAll()
    },

    deleteHandler(delIndex) {
      this.colorCache.delete(this.customColors[delIndex])
      this.customColors = this.colorCache.getAll()
    },

    handlePreset(c) {
      this.$emit('handlePreset', c)
    }
  }
}

</script>

<style lang="scss" scoped>
.vc-sketch-presets-color {
  overflow: initial;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: initial;
  color: $color-primary;
}

.del-color {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 2px;
  color: $color-danger;
  border-radius: 50%;
}

.icon-close-after {
  position: absolute;
  top: -3px;
  right: -4px;
  background: #fff;
  width: 10px;
  height: 10px;
  z-index: 0;
}
</style>
