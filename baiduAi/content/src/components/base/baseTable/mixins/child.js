import { validData } from '@/components/avue/utils/util'
import getParentAttrs from '@/components/base/baseTable/mixins/getParentAttrs'

export default function ({ name = 'basePage', fns = [] }) {
  return {
    mixins: [getParentAttrs],
    computed: {
      attrs() {
        return this.getParentAttrs('attrs')
      },
      resetMergeData() {
        return {
          ...this.$attrs.resetMergeData,
          ...this.sup_this.resetMergeData
        }
      },
      sup_this() {
        return this.$attrs.parent || this.$attrs.sup_this || this.$parent
      }
    },
    watch: {
      sup_this: {
        handler() {
          this.setParentFns()
        },
        immediate: true
      }
    },
    beforeDestroy() {
      if (this.sup_this) {
        this.setParentFns(false)
      }
    },
    methods: {
      setParentFns(isSet = true) {
        this.sup_this[name] = isSet ? this : undefined
        fns.forEach((fnName) => {
          if (this[fnName] && (!this.sup_this[fnName] || this.sup_this[fnName].origin === name)) {
            this[fnName].origin = name
            this.sup_this[fnName] = isSet ? this[fnName] : undefined
          }
        })
      },
      
      validData
    }
  }
}