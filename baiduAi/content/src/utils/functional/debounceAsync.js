/* eslint-disable */
import { debounce, isArray } from 'lodash'

// 直接赋值给vue.methods时，debounced上的函数（debounced.stop）会丢失，可能是vue使用了bind
// 使用了bind之后，新函数上就没有了debounced上的函数
export function debounceAsync(funcs, wait, options) {
  funcs = isArray(funcs) ? funcs : [funcs]
  
  let lastFuncs = []
  const debounceFn = debounce(func, wait, options)
  
  debounced.stop = stop
  debounced.cancel = debounceFn.cancel
  debounced.flush = debounceFn.flush
  return debounced
  
  function debounced() {
    stop()
    debounceFn.apply(this, arguments)
  }
  
  async function func() {
    lastFuncs = [...funcs]
    const params = { funcs, lastFuncs, arguments: arguments, stage: [] }
    for (const func of lastFuncs) {
      try {
        params.result = await func.call(this, params)
        params.stage.push(params.result)
      } catch (e) {
        console.log(e)
      }
    }
    return params.result
  }
  
  function stop() {
    lastFuncs.length = 0
  
    debounced.cancel()
  }
}