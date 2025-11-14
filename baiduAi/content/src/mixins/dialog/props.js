import upperFirst from 'lodash/upperFirst'

export default function (props = { value: {} }) {
  let watch = {}
  for (const propName in props) {
    let value = props[propName]
    if (
      !['type', 'default', 'required', 'validator'].some(key => value[key])
      && ![String, Number, Boolean, Array, Object, Function, Promise].includes(value)
    ) {
      props[propName] = { default: value }
    }
    
    let curName = `cur${upperFirst(propName)}`
    watch[propName] = {
      handler(n) {
        this[curName] = n
      },
      immediate: true
    }
  }
  return {
    props,
    data() {
      let data = {}
      for (const propName in props) {
        let curName = `cur${upperFirst(propName)}`
        data[curName] = ''
      }
      return data
    },
    watch
  }
}
