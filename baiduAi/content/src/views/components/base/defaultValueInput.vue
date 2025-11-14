<template>
  <el-input
    ref="input"
    v-model="finalValue"
    clearable
    :placeholder="finalPlaceholder"
    @focus="onfocus"
    @blur="onblur"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template slot="suffix">
      <slot name="suffix"></slot>
    </template>
    <template slot="append" v-if="column.appendText || $slots.append">
      <slot name="append">{{ column.appendText }}</slot>
    </template>
  </el-input>
</template>

<script>
import propsMixin from '@/mixins/dialog/props'
export default {
  mixins: [
    propsMixin({
      value: ''
    })
  ],
  props: {
    column: {
      default: () => ({})
    },
    form: {}
  },
  data() {
    return {
      isFocus: false
    }
  },
  computed: {
    // curValue 是否为 defaultValue
    isDefaultValue() {
      return this.column.defaultValue == this.curValue
    },
    finalValue: {
      get({ isDefaultValue, isFocus }) {
        if (isDefaultValue && !isFocus) return ''
        return this.curValue
      },
      set(n) {
        this.curValue = n
      }
    },
    finalPlaceholder({ column: { placeholder, defaultValue, label } }) {
      if (defaultValue) return defaultValue
      return placeholder || ('请输入' + label)
    }
  },
  methods: {
    onfocus() {
      this.isFocus = true
      if (this.isDefaultValue) {
        this.$nextTick(function () {
          this.$refs.input.select()
        })
      }
    },
    onblur() {
      this.isFocus = false
      if (!this.curValue) {
        this.$emit('input', this.column.defaultValue)
      }
    }
  }
}
</script>

<style lang="scss">
.crud-input {
  &.el-button--text {
    width: 100%;
    height: 40px;
    color: inherit;
    text-align: left;
    .crud-input-text {
      display: inline-block;
      max-width: calc(100% - 20px);
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }
  }
}
</style>
