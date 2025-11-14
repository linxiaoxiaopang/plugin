/* eslint-disable */
import { validData } from '@/components/avue/utils/util'

export default function (props) {
  const parentAttrsUnwatch = {}
  const computed = {}
  const watch = {}
  for (const prop of props) {
    const attrName = `${prop}_attr`
    parentAttrsUnwatch[prop] = attrName
    computed[attrName] = function () {
      return validData(this.$attrs[prop], this.sup_this[prop])
    }
    watch[attrName] = {
      handler(n) {
        // console.log('watch', prop, n, this)
        this.$set(this.parentAttrs, prop, n)
      },
      immediate: true,
      deep: true
    }
  }
  return {
    data() {
      return {
        parentAttrs: {},
        parentAttrsUnwatch
      }
    },
    computed: {
      ...computed,
      sup_this() {
        return this.$attrs.parent || this.$attrs.sup_this || this.$parent
      }
    },
    watch,
    methods: {
      getParentAttrs(prop, defaultValue) {
        // console.log('getParentAttrs', prop)
        if (this.parentAttrsUnwatch[prop]) return validData(this.parentAttrs[prop], defaultValue)
  
        // console.log('set watch getParentAttrs', prop)
        this.setParentAttrsWatch(prop)
  
        return validData(this.parentAttrs[prop], defaultValue)
      },
      setParentAttrsWatch(prop) {
        // console.log('set watch', prop)
        this.parentAttrsUnwatch[prop]?.()
        this.parentAttrsUnwatch[prop] = this.$watch(
          function () {
            return validData(this.$attrs[prop], this.sup_this[prop])
          },
          (n) => {
            // console.log('watch', prop, n)
            this.$set(this.parentAttrs, prop, n)
            // this.parentAttrs[prop] = n
          },
          { immediate: true, deep: true }
        )
      }
    }
  }
}