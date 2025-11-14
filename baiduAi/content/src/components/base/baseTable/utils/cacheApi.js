/* eslint-disable */
import { debounce, pull, isNumber } from 'lodash'

const defaultKey = '$own'
export default class CacheApi {
  constructor(api, wait, option = {}) {
    this.api = api || (() => {})
    this.option = Object.assign({ isLastRequest: true }, option)
  
    this.debounced = debounce(
      this.init,
      wait
    )
    this.debounce = (postData, key = defaultKey) => {
      const request = this.getRequest(key)
      request.cancel()
      return this.debounced(postData, key)
    }
    this.flush = this.debounced.flush // flush会返回最近一次debounce的结果
    this.cancel = this.debounced.cancel // 取消延迟的函数调用
    
    this.getDebounced = debounce(
      this.getData,
      wait
    )
    this.getDebounce = (postData, key = defaultKey) => {
      const request = this.getRequest(key)
      request.cancel()
      return this.getDebounced(postData, key)
    }
    this.getFlush = this.getDebounced.flush
    this.getCancel = this.getDebounced.cancel
  }
  
  init = async (postData, key = defaultKey) => {
    if (this.option.isLastRequest) {
      const request = this.getRequest(key)
      this.cacheData[key] = request.init(postData)
    } else {
      this.cacheData[key] = this.api(postData)
    }
    return this.cacheData[key] = await this.cacheData[key]
  }
  cacheData = {}
  getData = (postData, key = defaultKey) => {
    if (this.cacheData[key] !== undefined) return this.cacheData[key]
    return this.init(postData, key)
  }
  
  setAfterInit = (fn, key = defaultKey) => {
    const request = this.getRequest(key)
    request.add(fn)
  }
  lastRequest = {}
  getRequest = (key = defaultKey) => {
    return this.lastRequest[key] || (this.lastRequest[key] = new LastRequest([this.api]))
  }
  
  clear = (key = defaultKey) => {
    this.cacheData[key] = undefined
  }
  clearAll = () => {
    Object.keys(this.cacheData).forEach(this.clear)
  }
}

// 当init多次执行时，中断前几次init的后续操作，使得只有最后一次的init是执行完全
// 被中断的请求，会返回最后一次请求数据
export class LastRequest {
  constructor(apis) {
    this.apis = Array.isArray(apis) ? apis: [apis]
  }
  
  result = {}
  // 中断式执行：1、在具有多个await的函数中可以使用cancel中断当前await的执行
  // 2、多个api按顺序执行时，使用cancel中断下一个api的执行
  init = async (postData) => {
    this.cancel()
    const prevResult = this.result
    
    const result = this.result = { isLastRequest: true, resolves: prevResult.resolves || [] }
  
    for(let i = 0; i < this.apis.length; i++) {
      postData = await this.apis[i](postData, result, this)
      if (!result.isLastRequest) break
    }
    
    // 被中断的请求，会返回最后一次请求数据
    if (!result.isLastRequest) {
      return new Promise(resolve => result.resolves.push(resolve))
    }
  
    result.resolves.forEach(resolve => resolve(postData))
    result.resolves = null
    return postData
  }
  cancel = () => {
    this.result.isLastRequest = false
  }
  add = (api, index) => {
    if (isNumber(index)) {
      this.apis.splice(index, 0, api)
    } else {
      this.apis.push(api)
    }
  }
  toggle = (api, index) => {
    if (this.apis.includes(api)) {
      this.remove(api)
    } else {
      this.add(api, index)
    }
  }
  remove = (api) => {
    pull(this.apis, api)
  }
  
  getLastRequest = async (request) => {
    if (await this.isLastRequest(request)) {
      this.__resolves?.forEach(resolve => resolve(request))
      this.__resolves = null
      return request
    }
    
    if (!this.__resolves) this.__resolves = []
    return new Promise(resolve => this.__resolves.push(resolve))
  }
  isLastRequest = async (request) => {
    this.__lastRequest = request
    
    await request
    
    const isLastRequest = this.__lastRequest === request
    isLastRequest && (this.__lastRequest = null)
    return isLastRequest
  }
}