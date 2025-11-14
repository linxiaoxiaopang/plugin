/* eslint-disable */
import { isEqual as equal, isEmpty, isFunction, curryRight, flatMap } from 'lodash'
import { deleteObjKeys } from '@/components/avue/core/dataformat'

/**
 * 判断是否为空
 */
export function validatenull(val) {
  if (typeof val == 'boolean') {
    return false
  }
  if (isFunction(val)) return false
  if (val instanceof Array) {
    if (val.length == 0) return true
  } else if (val instanceof Object) {
    // isEmpty会校验函数的参数长度
    if (isEmpty(val)) return true
  } else {
    if (
      val == 'null' ||
      val == null ||
      val == 'undefined' ||
      val == undefined ||
      val === ''
    )
      return true
    return false
  }
  return false
}

// 是否是数字
export function isNumber(val) {
  var regPos = /^\d+(\.\d+)?$/ //非负浮点数
  var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/ //负浮点数
  return regPos.test(val) || regNeg.test(val)
}

export function isEqual(value, other, ignoreKeys) {
  if (!validatenull(ignoreKeys)) {
    value = deleteObjKeys(value, ignoreKeys)
    other = deleteObjKeys(other, ignoreKeys)
  }
  
  return equal(value, other)
}

export function validateList(list, validate) {
  list = Array.isArray(list) ? list : [list]
  return list.every(validate)
}
export function validateListCurry(validate) {
  validate.validateList = curryRight(validateList)(validate)
}

export async function validatePipe(...validates) {
  if (validatenull(validates)) return true
  
  for (let validate of validates) {
    validate = Array.isArray(validate) ? validate : [validate]
    validate = validate.filter(v => v !== undefined)
    
    const valid = await Promise.all(validate.map(v => typeof v === 'function' ? v() : v))
    if (!valid.every(Boolean)) return false
  }
  
  return true
}

export async function validPipe(...validates) {
  if (validatenull(validates)) return
  
  let result
  const validFn = validates.pop()
  const valid = await validatePipe(
    ...validates,
    () => result = validFn()
  )
  if (valid) return result
}

export async function validResult(...validFns) {
  if (validatenull(validFns)) return
  
  for (let validFn of validFns) {
    if (validFn === undefined) continue
    
    try {
      const result = await (typeof validFn === 'function' ? validFn() : validFn)
      if (!validatenull(result)) return result
    } catch (e) {
      console.log(e)
    }
  }
}

export function somePipe(...validFns) {
  if (validatenull(validFns)) return
  
  for (let validFn of validFns) {
    if (validFn === undefined) continue
    
    try {
      const result = typeof validFn === 'function' ? validFn() : validFn
      if (result) return result
    } catch (e) {
      console.log(e)
    }
  }
}

export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  
  if (funcs.length === 1) {
    return funcs[0]
  }
  
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

export function composeWrap(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  
  if (funcs.length === 1) {
    return funcs[0]
  }
  
  return funcs.reduce((a, b) => (func, ...args) => a(b(func, ...args), ...args))
}

export function composeAsync(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  
  if (funcs.length === 1) {
    return funcs[0]
  }
  
  return funcs.reduce((a, b) => async (...args) => a(await b(...args)))
}

export function composeLogWrap(composeFn) {
  return function (...funcs) {
    const result = []
    const log = (data) => {
      result.push(data)
      console.log('composeLog', { data, result })
      return data
    }
    return composeFn(
      log,
      ...flatMap(funcs, func => [func, log])
    )
  }
}
compose.log = composeLogWrap(compose)
composeWrap.log = composeLogWrap(composeWrap)
composeAsync.log = composeLogWrap(composeAsync)



export function createComposeValidate(validatenullFn = validatenull, composeType = 'async') {
  const validate = (data) => {
    if (validatenullFn(data)) throw ['错误的返回值：', data]
    return data
  }
  const composeFn = {
    default: compose,
    wrap: composeWrap,
    async: composeAsync
  }[composeType] || compose
  return function (...funcs) {
    return composeFn(
      ...flatMap(funcs, func => {
        if (func === undefined) return []
        if (typeof func === 'function') return [func, validate]
        return () => func
      })
    )
  }
}
export const composeValidAsync = createComposeValidate()