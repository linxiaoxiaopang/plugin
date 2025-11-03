import { MockClass } from './mockClass'

const instance = new MockClass()

// background.js
// 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 根据消息类型处理
  if (request.action === "getMockData") {
    instance.getYApiData(request).then((res) => {
      sendResponse(res)
    }).catch((err) => {
      sendResponse({
        code: 0,
        message: err
      })
    })
  }
  // 若处理是异步的（如包含 fetch），需返回 true 保持连接
  return true
})
