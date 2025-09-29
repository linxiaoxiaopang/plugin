const rowList = {
  matchKeyword(url) {
    return this.keywords.some(keyword => {
      const reg = new RegExp(keyword)
      return reg.test(url)
    })
  },

  onCookiesChanged({ cookie, removed, tabId }) {
    const current = this.cache[tabId]
    if (!current || removed) return
    if (!this.usedKeys.includes(cookie.name)) {
      current.cookiesMap[cookie.name] = cookie
      return
    }
    current.cookiesMap[cookie.name] = cookie
  },

  onBeforeNavigate({ details, cookies }) {
    const { url, tabId } = details
    if (!this.matchKeyword(url)) return
    const cookiesMap = arrayToObject(cookies)
    if (this.cache[tabId]) return
    this.cache[tabId] = {
      details,
      url,
      cookiesMap
    }
  },

  onActivated({ details }) {
    const { tabId } = details
    const current = this.cache[tabId]
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
      cache: {},
      keywords: ['https://seller.kuajingmaihuo.com/settle/site-main'],
      usedKeys: ['SUB_PASS_ID']
    },

    authentication: {
      cache: {},
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
      cache: {},
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


function compareRepeat(
  {
    cache,
    curTabId,
    prevTabId,
    prop
  }
) {
  if (!curTabId || !prevTabId) return
  const current = cache[curTabId]
  const prev = cache[prevTabId]
  if (!current || !prev) return false
  if (!prop) return false
  const { cookiesMap: currentCookiesMap } = current
  const { cookiesMap: prevCookiesMap } = prev
  const currentCookiesValue = currentCookiesMap[prop]?.value
  const prevCookiesValue = prevCookiesMap[prop]?.value
  return currentCookiesValue == prevCookiesValue
}

function arrayToObject(arr) {
  const obj = {}
  arr.forEach(item => {
    obj[item.name] = item
  })
  return obj
}

const multiStoreCookieKey = 'MULTI_STORE_COOKIE_KEY'
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    const multiStoreCookie = Object.keys(list).reduce((prev, cur) => {
      prev[cur] = list[cur].cache
      return prev
    }, {})
    chrome.storage.local.set({
      [multiStoreCookieKey]: multiStoreCookie
    }, () => {
      console.log('存储成功')
    })
    return
    // 可以在这里保存状态到 chrome.storage
  }
  chrome.storage.local.get([multiStoreCookieKey], result => {
    Object.keys(list).map(key => {
      const item = list[key]
      if(!Object.keys(item.cache).length) {
        item.cache = result[multiStoreCookieKey]?.[key] || {}
      }
    })
    console.log('读取成功')
  })
})
