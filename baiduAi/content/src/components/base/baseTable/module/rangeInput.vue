<template>
  <el-form
    ref="rangeForm"
    class="range-input flex-middle"
    :model="rangeForm"
    v-bind="$attrs"
    @submit.native.prevent
  >
    <el-form-item :prop="minProp" :error="error">
      <el-input-number
        v-model="rangeForm[minProp]"
        :controls="false"
        :min="min"
        :max="validData(rangeForm[maxProp] - step, max)"
        :step="step"
        :step-strictly="stepStrictly"
        :readonly="readonly"
        :disabled="disabled"
        :placeholder="'请输入最小' + label"
        @keyup.enter.native="searchChange"
      />
    </el-form-item>
    <slot name="separator"><span class="mlr10">-</span></slot>
    <el-form-item :prop="maxProp" :error="error">
      <el-input-number
        v-model="rangeForm[maxProp]"
        :controls="false"
        :min="validData(rangeForm[minProp] + step, min)"
        :max="max"
        :step="step"
        :step-strictly="stepStrictly"
        :readonly="readonly"
        :disabled="disabled"
        :placeholder="'请输入最大' + label"
        @keyup.enter.native="searchChange"
      />
    </el-form-item>
    <slot name="suffix"></slot>
  </el-form>
</template>

<script>
import emitter from 'element-ui/src/mixins/emitter'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  mixins: [emitter],
  props: {
    form: {
      default: () => ({})
    },
    label: String,
    prop: String,
    step: {
      type: Number,
      default: 1
    },
    stepStrictly: {
      type: Boolean,
      default: true
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: Infinity
    },
    minProp: {
      type: String,
      default: 'min'
    },
    maxProp: {
      type: String,
      default: 'max'
    },
    rules: {
      type: Array|Object,
      default: () => ({})
    },
    readonly: Boolean,
    disabled: Boolean
  },
  data() {
    return {
      rangeForm: {},
      error: ''
    }
  },
  computed: {

  },
  watch: {
    form: {
      handler(form) {
        this.rangeForm = form
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    this.dispatch('ElForm', 'el.form.addField', [this])
  },
  methods: {
    onchange() {
      this.$emit('change', this.rangeForm)
    },
    searchChange() {
      this.$emit('search-change', this.rangeForm)
    },

    async validate() {
      this.error = ''
      let valid = await this.$refs.rangeForm.validate()
      if (!valid) return valid
      let { label, minProp, maxProp, rangeForm } = this
      let { [minProp]: minVal,[maxProp]: maxVal } = rangeForm
      let isMinValNull = validatenull(minVal)
      let isMaxValNull = validatenull(maxVal)
      if (
        !(
          (isMinValNull && isMaxValNull) ||
          (!isMinValNull && !isMaxValNull)
        )
      ) {
        this.error = label + '应全填或不填'
        return false
      }
      return true
    },
    validateField(field) {
      return this.$refs.rangeForm.validateField(field)
    },
    resetFields() {
      return this.$refs.rangeForm.resetFields()
    },
    clearValidate(prop) {
      return this.$refs.rangeForm.clearValidate(prop)
    },

    resetField() {
      this.resetFields()
    },
    validData(value, defaultValue) {
      return value || value === 0 ? value : defaultValue
    }
  }
}
</script>

<style lang="scss">
.range-input.flex-middle.el-form {
  .el-form-item {
    margin-right: 0;
    margin-bottom: 0;
  }
}
</style>
