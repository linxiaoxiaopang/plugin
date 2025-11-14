/* eslint-disable */
import { CustomMap } from '@/utils/functional/customMap'

export function cacheWrap(fn) {
  let cacheData
  let isInvoked
  return (...args) => {
    if (isInvoked) return cacheData
    isInvoked = true
    return cacheData = fn(...args)
  }
}

export function cacheParamsWrap(fn) {
  const customMap = new CustomMap()
  return (...args) => {
    if (customMap.has(args)) return customMap.get(args)
    return customMap.set(args, fn(...args))
  }
}