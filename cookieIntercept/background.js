// background.js
const siteMainCache = {}
const gentsellerCache = {}

const siteMainKeyword = 'https://seller.kuajingmaihuo.com/settle/site-main'
const authenticationKeyword = 'https://agentseller.temu.com/main/authentication'
const agentsellerKeyword = 'https://agentseller.temu.com'

chrome.cookies.onChanged.addListener(async details => {
  const { cookie } = details
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!currentTab) return
  const { id: tabId } = currentTab
  if (siteMainCache[tabId]) {
    siteMainCache[tabId].cookiesMap[cookie.name] = cookie
  }

  if (gentsellerCache[tabId]) {
    gentsellerCache[tabId].cookiesMap[cookie.name] = cookie
  }
})

chrome.webNavigation.onBeforeNavigate.addListener(async details => {
  const { url, tabId } = details
  const newCookies = await chrome.cookies.getAll({ url })
  const newCookiesMap = arrayToObject(newCookies)
  if (url.indexOf(siteMainKeyword) >= 0) {
    if (siteMainCache[tabId]) return
    siteMainCache[tabId] = {
      details,
      url,
      cookiesMap: newCookiesMap
    }
    return
  }

  if (url.indexOf(authenticationKeyword) >= 0) {
    await chrome.cookies.remove({
      url,
      name: 'seller_temp'
    })

    await chrome.cookies.remove({
      url,
      name: 'maillid'
    })
    return
  }

  if(url.indexOf(agentsellerKeyword) >= 0) {
    if(gentsellerCache[tabId]) return
    gentsellerCache[tabId] = {
      details,
      url,
      cookiesMap: newCookiesMap
    }
    return
  }
})


chrome.tabs.onActivated.addListener(async (details) => {
  const { tabId } = details
  const siteMainUrl = siteMainCache[tabId]?.url
  const siteMainCookiesMap = siteMainCache[tabId]?.cookiesMap
  const gentsellerUrl = gentsellerCache[tabId]?.url
  const gentsellerCookieMap = gentsellerCache[tabId]?.cookiesMap
  if (siteMainCookiesMap?.SUB_PASS_ID) {
    const { domain, hostOnly, session, ...restCookie } = siteMainCookiesMap.SUB_PASS_ID
    await chrome.cookies.set({
      url: siteMainUrl,
      ...restCookie
    })
  }

  if (gentsellerCookieMap?.mallid) {
    const { domain, hostOnly, session, ...restCookie } = gentsellerCookieMap.mallid
    await chrome.cookies.set({
      url: gentsellerUrl,
      ...restCookie
    })
  }

  if (gentsellerCookieMap?.seller_temp) {
    const { domain, hostOnly, session, ...restCookie } = gentsellerCookieMap.seller_temp
    await chrome.cookies.set({
      url: gentsellerUrl,
      ...restCookie
    })
  }

  // 获取当前激活标签页的详细信息
  // chrome.tabs.get(tabId, (tab) => {
  //   if (tab) {
  //     console.log(`标签页 ${tabId} 被激活，网址: ${tab.url}`)
  //   }
  // })
})

function arrayToObject(arr) {
  const obj = {}
  arr.forEach(item => {
    obj[item.name] = item
  })
  return obj
}

