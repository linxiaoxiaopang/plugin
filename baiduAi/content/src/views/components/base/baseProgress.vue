<template>
  <el-progress
    :type="type"
    :width="width"
    :format="finalFormat"
    :color="color"
    v-bind="$attrs"
    v-on="$listeners"
  ></el-progress>
</template>

<script>
import { isString } from 'lodash'

export default {
  name: 'BaseProgress',
  props: {
    type: {
      type: String,
      default: 'circle'
    },
    width: {
      type: Number,
      default: 100
    },
    color: {
      type: Array,
      default: () => [
        { color: '#20a0ff', percentage: 100 },
        { color: '#13ce66', percentage: 100 }
      ]
    },
    format: String | Function
  },
  computed: {
    finalFormat({ format }) {
      if (isString(format)) {
        return (percentage) => {
          if (percentage === 100) {
            return format
          }
          return `${percentage}%`
        }
      }
      return format
    }
  }
}
</script>

<style lang="scss" scoped>

</style>