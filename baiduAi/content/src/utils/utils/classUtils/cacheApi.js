/* eslint-disable */
import { isBoolean } from 'lodash'

const DEFAULT_OPTION = {
  isWrapped: true,
  isLoading: true
}
export default class CacheApi {
  constructor(api, option) {
    if (isBoolean(option)) option = { isWrapped: option }
    const { isWrapped } = this.option = Object.assign({}, DEFAULT_OPTION, option || {})
    
    this.api = isWrapped ? this.wrappedApi(api) : api
    this.cacheData = Object.create(null)
  }
  
  async init(postData, key = '$own') {
    this.cacheData[key] = this.api(postData)
    return this.cacheData[key] = await this.cacheData[key]
  }
  
  getData(postData, key = '$own') {
    if (this.cacheData[key] !== undefined) return this.cacheData[key]
    return this.init(postData, key)
  }
  
  wrappedApi = (api) => {
    return async (...args) => {
      const wrapper = window[this.option.isLoading ? 'awaitResolveDetailLoading' : 'awaitResolveDetail'] || ((val) => val)
      const res = await wrapper(api(...args))
      if (!res) return
      return res
    }
  }
}