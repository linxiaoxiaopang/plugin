/* eslint-disable */
import { validatenull } from '../utils/validate'
import { findArray } from '../utils/util'

/**
 * 字符串数据类型转化
 */
export function detailDataType(value, type) {
  if (validatenull(value)) return value
  if (type === 'number') {
    return Number(value)
  } else if (type === 'string') {
    return value + ''
  } else {
    return value
  }
}
export function findObject(list, value, key = 'prop') {
  let result = -1
  let type = (() => {
    let result
    list.forEach((ele) => {
      if (ele.column) {
        result = 'group'
      } else if (ele.children) {
        result = 'tree'
      }
    })
    return result
  })()
  if (type === 'group') {
    list.forEach((ele) => {
      const val = findArray(ele.column, value, key, true)
      if (val !== -1) result = val
    })
  } else if (type === 'tree') {
    result = findLabelNode(list, value, { value: key }, true)
  } else {
    result = findArray(list, value, key, true)
  }
  return result
}
export function createObj(obj, bind) {
  let list = bind.split('.')
  let first = list.splice(0, 1)[0]
  let deep = {}
  deep[first] = {}
  if (list.length >= 2) {
    let start = '{'
    let end = '}'
    let result = ''
    list.forEach((ele) => {
      result = `${result}${start}"${ele}":`
    })
    result = `${result}""`
    for (let i = 0; i < list.length; i++) {
      result = `${result}${end}`
    }
    result = JSON.parse(result)
    deep[first] = result
  }
  obj = extend(true, obj, deep)
  return obj
}