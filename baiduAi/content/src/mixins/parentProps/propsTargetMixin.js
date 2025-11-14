/* eslint-disable */

export default function (option) {
  // dataAttrs: { [prop]: defaultOption }
  // prop: 默认属性
  // defaultOption: 默认值/配置项
  // defaultOption配置项: { $isOption: true, default, expOrFn, prop, alias }
  // $isOption必填
  // default默认值
  // alias别名
  // expOrFn 来源.$watch第一个参数
  const { name, dataAttrs } = option
  return {
    data() {
      return formatData(dataAttrs)
    },
    computed: {
      [name ? `${name}PropsOption` : 'propsTargetOption']() {
        return {
          target: this,
          props: formatProps(dataAttrs)
        }
      }
    }
  }
}

export function formatData(dataAttrs) {
  const tmpObj = {}
  Object.entries(dataAttrs).forEach(([prop, val]) => {
    try {
      if (val.$isOption) return tmpObj[prop] = val.default
    } catch (e) {}
    tmpObj[prop] = val
  })
  return tmpObj
}
export function formatProps(dataAttrs) {
  return Object.entries(dataAttrs).map(([prop, val]) => {
    try {
      if (val.$isOption) {
        val.prop = val.prop || prop
        return val
      }
    } catch (e) {}
    return prop
  })
}