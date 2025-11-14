/* eslint-disable */
import { validData } from '@/components/avue/utils/util'

export default {
  data() {
    return {
      parentAttrs: {}
    }
  },
  computed: {
    sup_this() {
      return this.$attrs.parent || this.$attrs.sup_this || this.$parent
    }
  },
  methods: {
    getParentAttrs(prop, defaultValue) {
      let { parentAttrs } = this
      if (parentAttrs[`$${prop}`]) return validData(parentAttrs[prop], defaultValue)
      
      parentAttrs[`$${prop}`]?.()
      parentAttrs[`$${prop}`] = this.$watch(
        function () {
          return validData(this.$attrs[prop], this.sup_this[prop])
        },
        function (n) {
          this.$set(parentAttrs, prop, n)
        },
        { immediate: true, deep: true }
      )
      
      return validData(parentAttrs[prop], defaultValue)
    }
  }
}