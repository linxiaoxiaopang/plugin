<template>
  <el-input
    v-model="text"
    :size="size"
    v-bind="$attrs"
    v-on="new$listeners"
  >
    <template v-for="name in otherSlots" v-slot:[name]="scope">
      <slot :name="name" v-bind="scope"></slot>
    </template>
  </el-input>
</template>

<script>
import { getArrFromStr } from '@/utils'

export default {
  name: 'separatorInput',
  props: {
    value: {
      default: ''
    },
    separator: String | RegExp,
    size: {
      type: String,
      default: 'small'
    }
  },
  data() {
    return {
      text: this.value
    }
  },
  computed: {
    new$listeners() {
      return Object.assign(
        {
          ...this.$listeners
        },
        {
          change: this.handleChange
        }
      )
    },
    otherSlots({ $scopedSlots, slotColumns = [] }) {
      let slots = Object.keys($scopedSlots)
      return slots.filter(slot => !slotColumns.includes(slot))
    },
    getArrFromStr({ separator }) {
      return (val) => getArrFromStr(val, separator)
    }
  },
  watch: {
    value(n) {
      this.text = n
    }
  },
  methods: {
    handleChange(value) {
      let handleValue = this.getArrFromStr(value)
      this.$emit('change', value)
      this.$emit('separator-input', handleValue)
      this.$emit('search-change', handleValue)
    }
  }
}
</script>

<style></style>
