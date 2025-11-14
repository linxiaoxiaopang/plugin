/* eslint-disable */
export function correctExecute(firstFn, ...args) {
  return args.reduce(async (prev, next, index, arr) => {
    let { success, error } = getExecuteFn(next)
    try {
      if (await prev) {
        return success()
      }
    } catch (e) {}
    
    if (typeof error === 'function') return error()
    arr.splice(index)
    
  }, firstFn())
}
export function getExecuteFn(param) {
  if (typeof param === 'function') {
    return {
      success: param
    }
  }
  return param
}

export function firstToUpperCase(str) {
  return str.trim().toLowerCase().replace(str[0], str[0].toUpperCase())
}

export function setCacheFactory(fnName, api) {
  let cacheName = `${fnName}Cache`
  let lastRequest
  return async function (postData, key = '$own') {
    if (!this[cacheName]) this[cacheName] = {}
    if (this[cacheName][key]) return this[cacheName][key]
    
    let promise = this[cacheName][key] = lastRequest = awaitResolve(api(postData))
  
    this[cacheName][key] = await promise
    return lastRequest === promise && promise
  }
}

export function getResult(res, ...args) {
  if (typeof res === 'function') res = res.apply(this, args)
  return res
}

/*  String  */
// 获取字符串中匹配字符串之前的值
export function getBeforeStr(str, matchStr) {
  const mediaIndex = str.indexOf(matchStr)
  if (mediaIndex < 0) return str
  return str.substr(0, mediaIndex)
}


/* Array */
export function concat(...items) {
  return [].concat(...items.filter(Boolean))
}