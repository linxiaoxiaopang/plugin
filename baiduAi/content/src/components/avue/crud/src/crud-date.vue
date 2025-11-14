<template>
  <el-date-picker
    class="avue-crud-date"
    :size="size"
    :type="type"
    v-model="text"
    :format="format"
    :value-format="valueFormat"
    :placeholder="placeholder || '请输入'+label"
    :clearable="clearable"
    range-separator="-"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    @change="handleChange"
    :disabled="disabled"
    :readonly="readonly"
  ></el-date-picker>
</template>

<script>
import {validatenull} from "@/components/avue/utils/validate";

export default {
  name: 'AvueCrudDate',
  props: {
    label: {
      type: String
    },
    value: {
      default: ''
    },
    size: {
      type: String
    },
    type: {
      default: 'date'
    },
    valueFormat: {
      default: 'yyyy-MM-dd'
    },
    format: {
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    clearable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      text: ''
    }
  },
  watch: {
    value: {
      handler(n) {
        if (!this.$moment(n).isValid()) return
        this.text = n
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    handleChange(value) {
      if (this.type==='daterange' && validatenull(value)) {
        this.$emit('input', [])
        this.$emit('search-change')
        return
      }
      this.$emit('input', value)
      this.$emit('search-change')
    }
  }
}
</script>

<style>
</style>
