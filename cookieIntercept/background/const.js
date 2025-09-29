import Storage from './utils/storage.js'

class Cache {
  constructor(cacheKey) {
    this.cacheKey = cacheKey
    this.timer = null
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
    this.loopClear()
    return this.cache.then(res => {
      res = res || {}
      res[key] = value
      return res
    }).then((res) => {
      return Storage.set(this.cacheKey, res)
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
    const current = await this.cache.get(tabId)
    if (!current || removed) return
    if (!this.usedKeys.includes(cookie.name)) {
      current.cookiesMap[cookie.name] = cookie
      this.cache.set(tabId, current)
      return
    }
    current.cookiesMap[cookie.name] = cookie
    this.cache.set(tabId, current)
  },

  async onBeforeNavigate({ details, cookies }) {
    const { url, tabId } = details
    if (!this.matchKeyword(url)) return
    const cookiesMap = arrayToObject(cookies)
    const current = await this.cache.get(tabId)
    if (current) return
    this.cache.set(tabId, {
      details,
      url,
      cookiesMap
    })
  },

  async onActivated({ details }) {
    const { tabId } = details
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
      onBeforeNavigate({ details }) {
        const { url } = details
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
