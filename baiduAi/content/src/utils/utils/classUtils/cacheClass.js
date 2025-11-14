import Vue from 'vue'
import { isArray, isEqual, isNil, isPlainObject, uniqBy, merge } from 'lodash'
import { validData } from '@/components/avue/utils/util'
import storage from '@/utils/utils/sessionUtils'


export default class CacheClass {
  constructor(maxNum) {
    this.cacheKeys = []
    this.cache = Object.create(null)
    this.maxNum = validData(maxNum, 100)
  }

  timeToStamp(time) {
    return time ? +new Date(time) : null
  }

  pushCache(key, item, time) {
    time = this.timeToStamp(time)
    this.adjustment(key, time)
    this.cache[key] = item
    return item
  }

  removeCache(data) {
    if (!isPlainObject(data)) data = { key: data }
    const fIndex = this.cacheKeys.findIndex(item => {
      return item.key == data.key
    })
    if (fIndex >= 0) this.cacheKeys.splice(fIndex, 1)
    delete this.cache[data.key]
  }

  updateCache(key, item, time) {
    time = this.timeToStamp(time)
    this.cache[key] = item
    if (!time) return
    const fItem = this.findCacheKeyItem(key)
    if (!fItem) return
    fItem.time = time
  }

  findCacheKeyItem(key) {
    return this.cacheKeys.find(item => item.key == key)
  }

  hasCache(key, time) {
    if (!time) return !!this.cache[key]
    time = this.timeToStamp(time)
    const fItem = this.findCacheKeyItem(key)
    if (!fItem) return false
    return fItem.time == time
  }

  getCacheItemByKey(key, time) {
    time = this.timeToStamp(time)
    if (!this.hasCache(key, time)) return null
    this.adjustment(key, time)
    return this.cache[key]
  }

  /**
   * 调整缓存的key值
   * @param key
   */
  adjustment(key, time) {
    this.cacheKeys = this.adjustmentPosToFirst(this.cacheKeys, key, time)
    const len = this.cacheKeys.length
    if (len > this.maxNum) {
      //删除最后一个位置的key
      this.removeCache(this.cacheKeys.pop())
    }
  }

  /**
   * 调整位置到第一个
   * @param data
   * @param item
   */
  adjustmentPosToFirst(data, item, time) {
    const shiftItem = {
      key: item,
      time
    }
    data.unshift(shiftItem)
    return uniqBy(data, 'key')
  }

  clearAllCache() {
    this.cache = Object.create(null)
    this.cacheKeys = []
  }
}

/**
 * 创建缓存实例
 * @param cacheInstance
 * @param cacheKey
 * @param time
 * @param callback
 * @returns {*}
 */

export function createBaseCacheInstance(cacheInstance, cacheKey, time, callback) {
  if (cacheInstance.hasCache(cacheKey, time)) {
    return cacheInstance.getCacheItemByKey(cacheKey, time)
  }
  const p = callback(cacheKey, time)
  if (!p) return p
  if (p instanceof Promise) {
    p.then((res) => {
      if (res) {
        cacheInstance.pushCache(cacheKey, res, time)
      }
      return res
    }, () => {
      // cacheInstance.pushCache(cacheKey, null, time)
      return null
    })
  }
  console.log('join', cacheKey)
  cacheInstance.pushCache(cacheKey, p, time)
  return p
}


/**
 * 本地缓存
 */
export class LocalCache {
  constructor(
    {
      maxNum,
      storageKey,
      field = 'id',
      storageType = 'local'
    }) {
    this.maxNum = maxNum
    this.storageKey = storageKey
    this.storageType = storageType // 存储类型，默认为 'local'
    this.field = field // 指定的属性字段
    this.cache = this.loadFromStorage()   // 从存储加载缓存数据
  }

  get storage() {
    if (!this.storageKey) return null
    if (this.storageType == 'local') return storage
    return storage.session
  }

  isComparePassField(value) {
    if (!this.field) return false
    if (!isPlainObject(value)) return false
    if (isNil(value[this.field])) return false
    return true
  }

  findExistItemIndex(item) {
    if (this.isComparePassField(item)) {
      return this.cache.findIndex(cacheItem => isEqual(cacheItem[this.field], item[this.field]))
    }
    return this.cache.findIndex(cacheItem => isEqual(cacheItem, item))
  }

  deleteItem(item) {
    const existingIndex = this.findExistItemIndex(item)
    if (existingIndex >= 0) {
      // 如果缓存中已存在相同属性字段值的数据，将其移动到数组的第一位
      this.cache.splice(existingIndex, 1)
    }
  }

  addItem(item) {
    this.delete(item)
    this.cache.unshift(item) // 将新的值插入到数组的最前面
    if (this.cache.length > this.maxNum) {
      // 如果缓存已满，删除最旧的缓存项
      this.cache.pop()
    }
  }

  // 删除缓存数据
  delete(value) {
    if (!isArray(value)) value = [value]
    value.map(item => {
      this.deleteItem(item)
    })
    this.saveToStorage() // 将缓存数据保存到存储中
  }

  // 添加值到缓存数组
  add(value) {
    if (!isArray(value)) value = [value]
    value.map(item => {
      this.addItem(item)
    })
    this.saveToStorage() // 将缓存数据保存到存储中
  }

  // 获取缓存数组
  getAll() {
    return [...this.cache] // 返回数组的副本，以防止外部修改原始数组影响缓存
  }

  // 清空缓存数组
  clear() {
    this.cache = []
    this.saveToStorage() // 将缓存数据保存到存储中
  }

  // 从存储中加载缓存数据
  loadFromStorage() {
    if (!this.storageKey) return []
    return this.storage.get(this.storageKey) || []
  }

  // 将缓存数据保存到存储中
  saveToStorage() {
    if (!this.storageKey) return
    this.storage.set(this.storageKey, this.cache)
  }
}


export class CacheComputed {
  constructor(target, computedOption, options = {}) {
    const computed = {}
    for (const key in computedOption) {
      target[key] = ''
      computed[key] = computedOption[key]
      Object.defineProperty(target, key, {
        get: () => {
          if (this.bus) return this.bus[key]
          return computedOption[key]()
        }
      })
    }
    target.bus = this.bus = new Vue(merge({}, options, {
      data: {
        target
      },
      computed
    }))
  }
}

export function setStaticComputed(target, computedOption) {
  const cacheData = {}
  for (const key in computedOption) {
    Object.defineProperty(target, key, {
      get: () => {
        const value = cacheData[key]
        if (value) return value
        
        return cacheData[key] = computedOption[key]()
      }
    })
  }
}


export class CacheVue {
  constructor(target, { vm, computed, options = {} }) {
    target.mountedVM = this.vm = vm
    target.bus = this.bus = new Vue(merge({}, options, {
      data: {
        target
      },
      computed
    }))
    
    for (const key in computed) {
      target[key] = ''
      Object.defineProperty(target, key, {
        get: () => {
          return this.bus[key]
        }
      })
    }
  
  
    let targetDestroy = target.destroy
    target.destroy = () => {
      this.bus?.$destroy?.()
      targetDestroy()
    }
    target.mountedVM?.$once('hook:beforeDestroy', () => target.destroy())
  }
}