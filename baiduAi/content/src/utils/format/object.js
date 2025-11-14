/* eslint-disable */
import { isArray, isPlainObject, isString, isNumber, isUndefined, isFunction, get, set, find } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export class FormatObject {
  static format(data, map, reverse) {
    if (isArray(data)) {
      return FormatObject.formatArray(data)
    }
    if (validatenull(data)) return {}
    
    map = FormatObject.normalizeMap(map, reverse)
    return FormatObject.handler(data, map)
  }
  static formatArray(data, map, reverse) {
    if (validatenull(data)) return []
    return [].concat(data).map(item => item && FormatObject.format(item, map, reverse))
  }
  
  static handler(data, map) {
    const result = {}
    for (let [key, value] of map) {
      key = getResult(key, data, result)
      value = FormatObject.result(value, data, result)
      if (isPath(key) && !isUndefined(value)) {
        set(result, key, value)
      }
    }
    return result
  }
  
  static result(handler, data, result) {
    if (isFunction(handler)) return handler(data, result)
    return get(data, handler)
  }
  
  static normalizeMap(map, reverse) {
    if (isPlainObject(map)) {
      map = Object.entries(map)
    } else if (validatenull(map)) { // 如果对象的属性值为函数，validatenull会将对象判断为空对象
      return []
    }
    map = map.map(([key, value, ...rest]) => [key, value ?? key, ...rest])
    if (reverse) {
      return map.map(([key, value, ...rest]) => [value, key, ...rest])
    }
    return map
  }
  
  static normalizeMulMap(keyMap, valueMap, reverse) {
    const normalizedKeyMap = FormatObject.normalizeMap(keyMap)
    const normalizedValueMap = FormatObject.normalizeMap(valueMap)
    const keymap = new Map(normalizedKeyMap)
    const valuemap = new Map(normalizedValueMap)
    const resultMap = []
    for (var [key, value] of keymap) {
      resultMap.push([
        value,
        valuemap.get(key)
      ])
    }
    return FormatObject.normalizeMap(resultMap, reverse)
  }
}

function isPath(val) {
  return isString(val) || isNumber(val) || isArray(val)
}

export function getResult(res, ...args) {
  if (typeof res === 'function') res = res(...args)
  return res
}

export function getMapValue(keyMap, valueMap, value) {
  const map = FormatObject.normalizeMulMap(keyMap, valueMap)
  return find(map, ([, valueValue]) => valueValue === value)?.[0]
}