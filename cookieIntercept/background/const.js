const rowList = {
  matchKeyword(url) {
    return this.keywords.some(keyword => {
      return url.indexOf(keyword) >= 0
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
      keywords: ['https://agentseller.temu.com/main/authentication'],
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
      keywords: ['https://agentseller.temu.com'],
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
