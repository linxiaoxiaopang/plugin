import { list } from './const.js'

chrome.cookies.onChanged.addListener(async details => {
  const { cookie, removed } = details
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!currentTab) return
  const { id: tabId } = currentTab
  traverse((item) => {
    item.onCookiesChanged?.({
      cookie,
      tabId,
      removed
    })
  })
})

chrome.webNavigation.onBeforeNavigate.addListener(async details => {
  const { url } = details
  const cookies = await chrome.cookies.getAll({ url })
  traverse((item) => {
    item.onBeforeNavigate?.({
      cookies,
      details
    })
  })
})

chrome.tabs.onActivated.addListener(async (details) => {
  traverse((item) => {
    item.onActivated?.({
      details
    })
  })
})

function traverse(callback) {
  return Object.keys(list).map(key => {
    const item = list[key]
    return callback(item, list)
  })
}
