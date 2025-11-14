/* eslint-disable */
import { merge } from 'lodash'
import { CustomMap } from '@/utils/functional/customMap'

const DEFAULT_OPTION = {
  clearTiming: 'finally' // set值清空时机
}

export class UniqClass {
  constructor(option = {}) {
    this.option = merge({}, DEFAULT_OPTION, option)
  }
  uniqObj = {}
  set = (key, value) => {
    if (this.uniqObj[key] !== undefined) return false
    this.uniqObj[key] = value
    this.afterSet(key, value)
    return true
  }
  get = (key) => {
    return this.uniqObj[key]
  }
  clear = (key) => {
    delete this.uniqObj[key]
  }
  clearAll = () => {
    this.uniqObj = {}
  }
  delaySet = () => {
    const cache = {}
    return (obj) => {
      const { key, value } = merge(cache, obj || {})
      if (![key, value].includes(undefined)) this.set(key, value)
    }
  }
  
  afterSet = (key, value) => {
    return this.clearAfterSet(key, value)
  }
  clearAfterSetMap = new CustomMap()
  clearAfterSet = async (key, value) => {
    const clear = this.clearAfterSetMap.set(key, () => {
      if (clear === this.clearAfterSetMap.get(key)) {
        this.clear(key)
        this.clearAfterSetMap.clear(key)
      }
    })
    
    const { clearTiming } = this.option
    switch (clearTiming) {
      case 'finally':
        if (value instanceof Promise) {
          await awaitWrap(value)
        }
        clear()
        return
      case 'none':
        clear()
        return
    }
    switch (typeof clearTiming) {
      case 'function':
        clearTiming(key, value, clear, this)
        return
      case 'number':
        if (value instanceof Promise) {
          await awaitWrap(value)
        }
        setTimeout(clear, clearTiming)
        return
    }
  }
}

export class UniqMapClass extends UniqClass {
  constructor(...args) {
    super(...args)
  }
  
  map = new CustomMap()
  set = (key, value) => {
    if (this.map.has(key)) return false
    this.map.set(key, value)
    this.afterSet(key, value)
    return true
  }
  get = this.map.get
  clear = this.map.clear
  clearAll = this.map.clearAll
}