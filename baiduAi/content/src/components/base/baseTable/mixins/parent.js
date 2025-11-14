/* eslint-disable */
import { cloneDeep, uniq } from 'lodash'

export default function (option) {
  const { name = 'basePage', dataAttrs, isCloneDeep } = option || {}
  return {
    data() {
      this[`${name}Unwatchs`] = {}
      return {
        ...dataAttrs,
        [name]: null
      }
    },
    watch: {
      [name]: {
        handler(basePage) {
          if (!basePage) return
          createWatcher.call(this, dataAttrs, isCloneDeep, name)
          // dataAttrs 里的属性只允许从child获取
          if (basePage.disabledParentProp) {
            basePage.disabledParentProp = uniq(basePage.disabledParentProp.concat(Object.keys(dataAttrs)))
          }
        },
        immediate: true
      }
    },
    updated() {
      this[name] = this.$refs[name]
    }
  }
}

export function createWatcher(dataAttrs, isCloneDeep, name) {
  const unName = [`${name}Unwatchs`]
  for (let key in dataAttrs) {
    // basePage中不存在这个key值
    if(this[name]?.[key] === undefined) return
    
    typeof this[unName][key] === 'function' && this[unName][key]()
    this[unName][key] = this.$watch(
      () => {
        return this[name]?.[key]
      },
      (childData) => {
        this[key] = isCloneDeep ? cloneDeep(childData) : childData
      },
      {
        deep: true,
        immediate: true
      }
    )
  }
}
