<template>
  <el-row class="color-select-wrapper no-empty" :class="{ 'is-disabled': disabled }" :gutter="8">
    <el-col
      v-for="(product) in dic"
      :key="product.value"
    >
      <div
        class="color-wrapper"
        :style="{ background: product.label }"
        @click.stop.prevent="handleChange(product.value)"
      >
        <div
          v-if="dic.length > 1"
          :class="['color', text === product.value && 'active']"
        ></div>
        <div v-else class="color"></div>
      </div>
    </el-col>
  </el-row>
</template>
<script>
import emitter from 'element-ui/src/mixins/emitter'

export default {
  name: 'ColorSelect',
  mixins: [emitter],
  props: {
    value: {},
    dic: {
      type: Array,
      default: () => ([])
    },
    disabled: Boolean
  },
  data() {
    return {
      text: ''
    }
  },
  watch: {
    value: {
      handler(n) {
        this.text = n
      },
      immediate: true
    }
  },
  methods: {
    handleChange(value) {
      if (this.disabled) return

      this.text = value
      this.$emit('input', value)
      this.$emit('change', value)
      this.$emit('selection-change', value)

      this.dispatch('ElFormItem', 'el.form.change', [value])
    }
  }
};
</script>

<style lang="scss" scoped>
.color-select-wrapper {
  overflow: hidden;
}
.el-col {
  display: inline-block;
  width: auto;
}
.color-wrapper {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  vertical-align: middle;
  cursor: pointer;
}
.color {
  top: 0;
  left: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid;
  color: $border-color;
  &.active {
    color: $color-primary;
  }
}

.is-disabled {
  cursor: not-allowed;
  .color-wrapper {
    cursor: not-allowed;
  }
}
</style>