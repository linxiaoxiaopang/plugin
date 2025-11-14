import store from '@/store'
import { isPlainObject, isUndefined } from 'lodash'

const DEFAULT_OPTION = {
  type: 'store'
}

const list = {
  store: {
    update(params) {
      store.commit('cache/UPDATE_CACHE_DATA', params)
    },

    delete(params) {
      store.commit('cache/DELETE_CACHE_DATA', params)
    }
  }
}

export class CreateCache {
  constructor(
    option = {}
  ) {
    option = CreateCache.normalizeOption(option)
    const { type, defaultKey } = option
    this.type = type
    this.defaultKey = defaultKey || ''
  }

  get data() {
    const { type } = this
    if (type === 'store') {
      return store.state.cache.cacheData
    }
    return null
  }

  get option() {
    return list[this.type] || list.store
  }


  static normalizeOption(option) {
    if (!isPlainObject(option)) option = { type: option }
    return Object.assign({}, DEFAULT_OPTION, option)
  }

  getData(option, defaultValue) {
    if (!isPlainObject(option)) {
      option = { path: option }
    }
    if (isUndefined(option.key)) option.key = this.defaultKey
    const { key, path } = option
    try {
      if (!path) return this.data[key] || defaultValue || this.data[key]
      return this.data[key][path] || defaultValue || this.data[key][path]
    } catch {
      return defaultValue
    }
  }

  update(
    {
      key,
      path,
      value
    }
  ) {
    if (isUndefined(key)) key = this.defaultKey
    this.option.update({
      key,
      path,
      value
    })
  }

  delete(params) {
    if (!isPlainObject(params)) params = { path: params }
    params.key || (params.key = this.defaultKey)
    if (!params.key) params.key = this.defaultKey
    this.option.delete(params)
  }
}

export const storeCacheInstance = new CreateCache()
