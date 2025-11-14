/* eslint-disable */
export default function (refName, assignMethodNames) {
  let methods = {}
  assignMethodNames?.forEach(name => {
    methods[name] = function (...args) {
      let fn = this.$refs[refName]?.[name]
      return typeof fn === 'function' ? fn(...args) : true
    }
  })
  return {
    methods: {
      ...methods,
      [`${refName}Methods`](fnName, ...args) {
        this.$nextTick(function () {
          this.runFn(this.$refs[refName]?.[fnName], ...args)
        })
      },
  
      runFn(fn, ...args) {
        return typeof fn === 'function' && fn(...args)
      }
    }
  }
}
