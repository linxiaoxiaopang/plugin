/* eslint-disable */
import { cloneDeep } from 'lodash'

export function logWrap(fn) {
  return (...args) => {
    console.log('logWrap', cloneDeep(args))
    const res = fn(...args)
    console.log('logWrap', cloneDeep(res))
    return res
  }
}