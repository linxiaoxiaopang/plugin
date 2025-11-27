import { list } from './const.js'

chrome.cookies.onChanged.addListener(async tab => {
  const { cookie, removed } = tab
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

chrome.webNavigation.onBeforeNavigate.addListener(async tab => {
  const { url } = tab
  const cookies = await chrome.cookies.getAll({ url })
  traverse((item) => {
    item.onBeforeNavigate?.({
      cookies,
      tab
    })
  })
})

chrome.tabs.onActivated.addListener(async (tab) => {
  traverse((item) => {
    item.onActivated?.({
      tab
    })
  })
})

// background.js（Manifest V3/V2 通用，V3 需确保 Service Worker 被唤醒）
chrome.tabs.onCreated.addListener(async (tab) => {
  // tab：新创建的 Tab 完整信息对象
  traverse((item) => {
    item.onCreated?.({
      tab
    })
  })
})

// 第二步：监听该空白 Tab 的更新，捕获重定向 URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 仅关注目标空白 Tab（过滤其他 Tab 的更新）
  traverse((item) => {
    item.onUpdated?.({
      tab
    })
  })
})

// 监听 Tab 被移除（关闭）事件
// tabId：被关闭的 Tab ID；removeInfo：关闭相关信息（含窗口 ID、是否窗口关闭导致）
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  traverse((item) => {
    item.onRemoved?.({
      tabId
    })
  })
})

function traverse(callback) {
  return Object.keys(list).map(key => {
    const item = list[key]
    return callback(item, list)
  })
}
