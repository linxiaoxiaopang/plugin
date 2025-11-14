<template>
  <base-input-number
    v-model="text"
    :controls="controls"
    :controls-position="controlsPosition"
    :precision="precision"
    :step="step"
    :size="size"
    :min="min"
    :max="max"
    :clearable="clearable"
    :placeholder="placeholder || '请输入'+label"
    :disabled="disabled"
    :class="{ [`text-align--${ textAlign }`]: textAlign, 'has-append': finalAppendText || $slots.append }"
    @input="handleInput"
    @change="handleChange"
  >
    <template #prepend>
      <slot v-if="finalPrependText || $slots.prepend" name="prepend">{{ finalPrependText }}</slot>
    </template>
    <template #append>
      <slot v-if="finalAppendText || $slots.append" name="append">{{ finalAppendText }}</slot>
    </template>
  </base-input-number>
</template>

<script>
export default {
  name: 'AvueCrudInputNumber',
  inheritAttrs: false,
  data() {
    return {
      text: 0
    }
  },
  props: {
    label: {
      type: String,
      default: ''
    },
    value: Number|String,
    disabled: Boolean,
    precision: Number,
    step: Number,
    placeholder: String,
    size: String,
    controls: {
      type: Boolean,
      default: true
    },
    controlsPosition: String,
    min: Number,
    max: Number,
    textAlign: {
      type: String,
      default: 'left'
    },
    clearable: {
      type: Boolean,
      default: true
    },
    column: {
      type: Object,
      default: () => ({})
    },
    appendText: String,
    prependText: String
  },
  computed: {
    finalAppendText() {
      return this.appendText || this.column.appendText
    },
    finalPrependText() {
      return this.prependText || this.column.prependText
    }
  },
  watch: {
    value: {
      handler(n) {
        this.text = this.value
      },
      immediate: true
    },
  },
  created() {
    this.text = this.value
  },
  mounted() {},
  methods: {
    handleInput(value) {
      this.$emit('input', value)
    },
    handleChange(value) {
      this.$emit('change', value)
      this.$emit('search-change', value)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  &.text-align--left {
    &.el-input-number .el-input__inner {
      text-align: left;
    }
  }

  &.has-append {
    .el-input {
      display: inline-table;

      .el-input__inner {
        padding-right: 0;
      }
      .el-input-group__append {
        padding: 0 10px;
      }
    }
    .el-input-number__increase + .el-input {
      .el-input-group__append {
        padding-right: 42px;
      }
    }
  }
}
</style>
