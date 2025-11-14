/* eslint-disable */
import { isString, isFunction, isArray } from 'lodash'

export function mergeRules(target, source) {
  return [].concat(target, source)
}

export function formatValidates(target, validates, args) {
  return handler(validates)
  
  function handler(validates) {
    if (isString(validates)) validates = target[validates]
    if (isFunction(validates)) return validates.bind(target, ...args)
    
    if (!isArray(validates)) return validates
    return validates.map(validate => {
      return handler(validate)
    })
  }
}