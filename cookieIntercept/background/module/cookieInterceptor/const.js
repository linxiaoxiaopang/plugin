import Storage from '../../utils/storage.js'

class Cache {
  constructor(cacheKey) {
    this.cacheKey = cacheKey
    this.timer = null
    this.promiseList = {
      delete: {
        list: [],
        promise: null
      }
    }
    this.interval = 1000 * 60
  }

  get cache() {
    return Storage.get(this.cacheKey)
  }

  set cache(value) {
    return Storage.set(this.cacheKey, value)
  }

  get(key) {
    return this.cache.then(res => {
      if (!res) return null
      return res[key]
    })
  }

  set(key, value) {
    // this.loopClear()
    return this.cache.then(res => {
      res = res || {}
      res[key] = value
      return res
    }).then((res) => {
      return Storage.set(this.cacheKey, res)
    })
  }

  async delete(key) {
    const { promiseList } = this
    const list = promiseList.delete.list
    const fIndex = list.findIndex(item => item == key)
    if (fIndex >= 0) return
    list.push(key)
    const promise = promiseList.delete.promise
    if (promise) return
    const delKey = list.shift()
    const p = new Promise(async resolve => {
      const cache = await this.cache
      delete cache[delKey]
      await Storage.set(this.cacheKey, cache)
      resolve(true)
    })
    promiseList.delete.promise = p
    p.then(() => {
      promiseList.delete.promise = null
      if (!list.length) return
      this.delete(list.shift())
    })
  }

  loopClear() {
    this.timer && clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      chrome.tabs.query({}, async (tabs) => {
        const cache = await this.cache
        const allTabIds = tabs.map(tab => tab.id)
        Object.keys(cache || {}).map(key => {
          const fItem = allTabIds.find(tabId => tabId == key)
          if (!fItem) delete cache[key]
        })
        this.cache = cache
      })
    }, this.interval)
  }
}

const rowList = {
  matchKeyword(url) {
    return this.keywords.some(keyword => {
      const reg = new RegExp(keyword)
      return reg.test(url)
    })
  },

  async onCookiesChanged({ cookie, removed, tabId }) {
    // const current = await this.cache.get(tabId)
    // if (!current || removed) return
    // if (!this.usedKeys.includes(cookie.name)) {
    //   current.cookiesMap[cookie.name] = cookie
    //   this.cache.set(tabId, current)
    //   return
    // }
    // current.cookiesMap[cookie.name] = cookie
    // this.cache.set(tabId, current)
  },

  async onCreated({ tab }) {
    const { id: tabId } = tab
    const url = tab.url = tab.pendingUrl
    if (!this.matchKeyword(url)) return
    const cookies = await chrome.cookies.getAll({ url })
    const cookiesMap = arrayToObject(cookies)
    this.cache.set(tabId, {
      url,
      tab,
      cookiesMap
    })
  },

  async onUpdated({ tab }) {
    const { id: tabId, url } = tab
    if (!this.matchKeyword(url)) return
    const cookies = await chrome.cookies.getAll({ url })
    const cookiesMap = arrayToObject(cookies)
    this.cache.set(tabId, {
      url,
      tab,
      cookiesMap
    })
  },

  async onRemoved({ tabId }) {
    const cache = await this.cache.cache
    if (!cache) return
    this.cache.delete(tabId)
  },

  async onBeforeNavigate({ tab, cookies }) {
    // const { url, tabId } = tab
    // if (!this.matchKeyword(url)) return
    // const cookiesMap = arrayToObject(cookies)
    // const current = await this.cache.get(tabId)
    // if (current) return
    // this.cache.set(tabId, {
    //   tab,
    //   url,
    //   cookiesMap
    // })
  },

  async onActivated({ tab }) {
    const { tabId } = tab
    const current = await this.cache.get(tabId)
    if (!current) return
    const url = current?.url
    const cookiesMap = current?.cookiesMap
    this.usedKeys.map(async key => {
      if (!cookiesMap[key]) return
      const { domain, hostOnly, session, isSet, ...rest } = cookiesMap[key]
      await chrome.cookies.set({
        url,
        ...rest
      })
    })
  },

  column: {
    siteMain: {
      cache: new Cache('siteMainCookieCacheKey'),
      keywords: ['https://seller.kuajingmaihuo.com/settle/site-main'],
      usedKeys: ['SUB_PASS_ID']
    },

    authentication: {
      cache: new Cache('authenticationCookieCacheKey'),
      keywords: ['https://agentseller(-[a-z]+)?.temu.com/main/authentication'],
      usedKeys: ['mallid', 'seller_temp'],
      onCookiesChanged() {
        return true
      },
      onBeforeNavigate({ tab }) {
        const { url } = tab
        if (!this.matchKeyword((url))) return
        this.usedKeys.map(async name => {
          await chrome.cookies.remove({
            url,
            name
          })
        })
      },
      onActivated() {
        return true
      }
    },

    gentseller: {
      cache: new Cache('gentsellerCookieCacheKey'),
      keywords: ['https://agentseller(-[a-z]+)?.temu.com', 'https://seller.kuajingmaihuo.com'],
      usedKeys: ['mallid', 'seller_temp']
    }
  }
}

export const list = (function () {
  const tmpObj = {}
  const { column, ...rest } = rowList
  for (const key in column) {
    tmpObj[key] = {
      ...rest,
      ...column[key]
    }
  }
  return tmpObj
})()


function arrayToObject(arr) {
  const obj = {}
  arr.forEach(item => {
    obj[item.name] = item
  })
  return obj
}
