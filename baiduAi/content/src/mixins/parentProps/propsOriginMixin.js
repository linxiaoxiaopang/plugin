/* eslint-disable */
import { isArray } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  props: {
    // { target, props }
    // target: 目标实例
    // props: 需要的属性
    propsOption: Object | Array
  },
  watch: {
    propsOption: {
      handler(option) {
        if (!validatenull(option)) {
          option = isArray(option) ? option : [option]
          for (const item of option) {
            if (!item) continue
            
            let unwatchs = {}
            const { target, props } = item
            for (let propOption of props) {
              if (typeof propOption === 'string') propOption = { expOrFn: propOption, alias: propOption }
              const { expOrFn, prop, alias = prop || expOrFn } = propOption
              unwatchs[alias] = this.$watch(
                expOrFn,
                function (val) {
                  target[alias] = val
                },
                { immediate: true }
              )
            }
            function doUnwatchs() {
              if (!unwatchs) return
              for (const unwatch of Object.values(unwatchs)) {
                unwatch()
              }
              unwatchs = null
            }
            this.$on('hook:beforeDestroy', doUnwatchs)
            target.$on('hook:beforeDestroy', doUnwatchs)
          }
        }
      },
      immediate: true
    }
  },
  methods: {
  
  }
}