/* eslint-disable */
import { Message } from 'element-ui'
import { GetLastPromise } from '@/utils/promise'
import LimitQueue from '@/utils/utils/limitQueue'
import { flatten, map } from 'lodash'

const noop = () => {}
export class Progress {
  constructor({ api, onSuccess, onError, retryCount = 1, vm } = {}) {
    this.api = api
    this.onSuccess = onSuccess || noop
    this.onError = onError || (() => Message.error('网络异常，请重试！'))
    this.retryCount = retryCount
    this.reset()

    this.vm = vm
    vm?.$once('hook:beforeDestroy', this.destroy)
  }
  action = async (...args) => {
    this.reset()
    this.status = 1
    this.processing = 1
    clearTimeout(this.timer)
    return this.doFn(...args)
  }
  doFn = async (...args) => {
    const handler = async (resolve) => {
      const detail = await this.api(...args)
      if (!detail) {
        if (this.hadRetryCount++ >= this.retryCount) {
          this.onError()
          this.reset()
          return
        }
        if (this.requestUuid) {
          this.timer = setTimeout(() => handler(resolve), 1000)
        }
        return
      }
      this.hadRetryCount = 0
      this.detail = detail
      this.requestUuid = detail.requestUuid
      const percentage = this.percentage = detail.isFinish ? 100 :
        detail.totalTasks && detail.completedTasks
          ? Math.floor(detail.completedTasks / detail.totalTasks * 100)
          : 0
      if (percentage >= 100) {
        this.percentage = 100
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.processing = 0
        this.status = 2
        const result = this.onSuccess(detail)
        resolve(result)
        return result
      } else if (detail.requestUuid) {
        this.timer = setTimeout(() => handler(resolve), 1000)
      }
    }
    return new Promise(handler)
  }

  reset = () => {
    console.log('reset')
    this.stopProgress()
    this.status = 0
    this.processing = 0
    this.percentage = 0
    this.timer = null
    this.requestUuid = ''
    this.detail = {}
    this.hadRetryCount = 0
  }
  destroy = () => {
    this.stopProgress()
    clearTimeout(this.timer)
  }

  getLastPromise = new GetLastPromise()
  stopProgress = () => {
    this.getLastPromise.wait = () => new Error('停止进程')
    this.getLastPromise = new GetLastPromise()
  }
  
  get inBatchesQueue() {
    if (this._inBatchesQueue) return this._inBatchesQueue
    return this._inBatchesQueue = new LimitQueue({ limit: 2 })
  }
  inBatches = async ({ data, api, callback, step, onProgress } = {}) => {
    onProgress = onProgress || (step ? this.createOnProgress(step) : async () => {})

    let i = 0
    let len = data.length
    let result = []
    if (api) {
      let isValid = true
      result = await this.inBatchesQueue.action(
        map(data, (item) => async () => {
          if (!isValid) return
          
          const res = await api(item)
          try {
            await onProgress(Math.floor(++i / len * 100))
          } catch (e) {
            isValid = false
            this._inBatchesQueue.queues = []
            throw e
          }
          return res
        })
      )
      if (!isValid) throw new Error('取消')
      result = flatten(result)
    } else {
      for (const item of data) {
        const res = await callback(item)
        await onProgress(Math.floor(++i / len * 100))
        // console.log(i, len, Math.floor(i / len * 100))
        result = result.concat(res)
      }
    }
    return result
  }
  apiProgressWrap = async (api, step = 20) => {
    let isRequested = false
    const p = api instanceof Promise ? api : api()
    p.finally(() => isRequested = true)

    const onProgress = this.createOnProgress(step)
    let count = step - 1
    for (let i = 0; i < count; i++) {
      if (isRequested) break
      await new Promise(resolve => setTimeout(resolve, 500))
      await onProgress(i / step * 100)
    }
    await onProgress(100)
    return p
  }
  createOnProgress = (step = 20) => {
    const startPercentage = this.percentage
    let lastPercentage = startPercentage
    return async (percentage) => {
      console.log('createOnProgress')
      await this.getLastPromise.globalWait()
      console.log('createOnProgress done')
      
      const curPercentage = this.percentage = startPercentage + Math.floor(percentage / 100 * step)
      // console.log(this.percentage, { percentage, curPercentage, lastPercentage })
      if (curPercentage !== lastPercentage) {
        // console.log(this.percentage, { percentage, curPercentage, lastPercentage })
        lastPercentage = curPercentage
        // 等待进度条回显
        await new Promise(resolve => setTimeout(resolve, 1000 / 9))
        await this.vm?.$nextTick()
      }
    }
  }
}
