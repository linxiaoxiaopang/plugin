/* eslint-disable */
import { debounce } from 'lodash'
import { createGlobalWait } from '@/components/avue/utils/globalWait'

export class GetLastPromise {
  constructor() {
    this.__globalWait = createGlobalWait()
  }
  
  wait = (promise) => {
    return new Promise(async (resolve, reject) => {
      this.lastPromise = promise
      await promise
      // 只有最后一次才会被返回
      if (this.lastPromise !== promise) return reject('当前请求不是最后一次')
      resolve(promise)
    })
  }
  waitWrap(func) {
    return (...args) => this.wait(func(...args))
  }
  
  globalWait = (wait) => {
    return this.wait(this.__globalWait(wait))
  }
}

export function promiseAllResult(promises, resultType) {
  return new Promise((resolveFn) => {
    const result = {
      res: [],
      resolve: (index, res) => {
        result.res[index] = { res, isFulfilled: true }
      },
      reject: (index, res) => {
        result.res[index] = { res, isRejected: true }
      }
    }
    const resolve = () => {
      let res = []
      switch (resultType) {
        case 'resolve':
          res = result.res.filter(item => item.isFulfilled).map(item => item.res)
          break
        case 'reject':
          res = result.res.filter(item => item.isRejected).map(item => item.res)
          break
        default:
          res = result.res.map(item => item.isFulfilled ? item.res : false)
      }
      resolveFn(res)
    }
    if (!Array.isArray(promises) || promises.length === 0) return resolve()
    let resLen = 0
    promises.map((promise, index) => {
      if (!(promise instanceof Promise)) {
        result.resolve(index, promise)
        if (++resLen === promises.length) resolve()
        return
      }
      return promise
        .then((data) => {
          result.resolve(index, data)
        })
        .catch((err) => {
          result.reject(index, err)
        })
        .finally(() => {
          if (++resLen === promises.length) resolve()
        })
    })
  })
}

export function debounceWrap(func, wait, options) {
  const resolves = []
  const debounced = debounce(
    async () => {
      const p = func()
      resolves.forEach(resolve => resolve(p))
      resolves.length = 0
    },
    wait,
    options
  )
  return () => {
    return new Promise(resolve => {
      resolves.push(resolve)
      debounced()
    })
  }
}