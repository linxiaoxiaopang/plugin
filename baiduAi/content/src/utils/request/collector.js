/* eslint-disable */
import { UniqMapClass } from '@/utils/utils/classUtils/uniqClass'
import { compose } from '@/components/avue/utils/validate'
import { debounceWrap } from '@/utils/promise'
import { filter, uniqWith, merge, map, isPlainObject } from 'lodash'
import { isEqualComplex } from '@/utils/functional/isEqual'
import { REQUEST_ALL_DATA } from '@/utils/constant'

/**
 * @description: 利用接口的批量请求特性，将单个请求收集起来，一起请求
 * @description: 具有缓存功能
 */
export class Collector {
  constructor(option) {
    console.log('Collector', this)
    
    this.option = merge({
      cache: true,
      cacheTiming: 5000,
      wait: 100,
      
      idProp: 'id',
      valueHandler: (detail, task) => this.option.idProp ? filter(detail, { [this.option.idProp]: task.key }) : detail,
      idListProp: 'idList',
      getParams: (queue) => ({
        ...REQUEST_ALL_DATA,
        [this.option.idListProp]: map(queue, 'key')
      }),
      success: () => {},
      error: () => {}
      
    }, option)
    
    if (this.option.cache) {
      // 数据缓存
      this.cache = new UniqMapClass({
        cacheTiming: this.option.cacheTiming
      })
      this.request = this.cacheWrap(this.request)
      this.action = this.cacheActionWrap(this.action)
    }
    
    // debounceWrap：利用防抖，暂缓请求，以便收集单个请求
    this.request = debounceWrap(this.request, this.option.wait)
  }
  queue = []
  action = (task = {}) => {
    if (!isPlainObject(task)) task = { key: task }
    
    this.queue.push(task)
    return this.request()
  }
  request = async () => {
    const queue = this.uniqQueue
    this.queue = []
    
    const detail = await compose(awaitResolveDetail, this.option.api, this.option.getParams)(queue)
    
    if (detail) {
      this.option.success(detail)
      for (const { success } of queue) {
        success?.(detail)
      }
    } else {
      this.option.error(detail)
      for (const { error } of queue) {
        error?.(detail)
      }
    }
    
    return detail
  }
  
  cacheActionWrap = (action) => {
    return async (task) => {
      if (!isPlainObject(task)) task = { key: task }
      
      let p = this.cache.get(task.key)
      if (p) return p
      
      await action(task)
      
      return this.cache.get(task.key)
    }
  }
  cacheWrap = (request) => {
    return () => {
      const queue = this.uniqQueue
      const p = request() // requestFn会清空queue
      for (const task of queue) {
        this.cache.set(
          task.key,
          new Promise(async resolve => {
            const detail = await p
            const valueHandler = task.valueHandler || this.option.valueHandler
            const result = valueHandler ? valueHandler(detail, task) : detail
            resolve(result)
          })
        )
      }
      
      return p
    }
  }
  
  get uniqQueue() {
    return uniqWith(this.queue, isEqualComplex)
  }
}