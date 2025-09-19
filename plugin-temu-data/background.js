// 监听请求发送事件，捕获请求

const cacheRequest = {
  headers: null,
  body: null
}



chrome.webRequest.onSendHeaders.addListener(
  async (details) => {
    // 构建请求信息对象
    if (details.method == 'OPTIONS') return

    cacheRequest.headers = details.requestHeaders.reduce((prev, cur) => {
      prev[cur.name] = cur.value
      return prev
    }, {})
  },
  { urls: ["https://www.temu.com/api/bg/circle/c/mall/newGoodsList*"] }, // 监听所有URL
  ["requestHeaders", "extraHeaders"] // 需要获取的信息
)

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    // 构建请求信息对象
    if (!details.requestBody || !details.requestBody.raw) return

    // 获取ArrayBuffer数据
    const arrayBuffer = details.requestBody.raw[0].bytes

    // 1. 转换为UTF-8字符串（适用于JSON、文本等）
    let textContent
    try {
      const decoder = new TextDecoder('utf-8')
      textContent = decoder.decode(arrayBuffer)
      console.log('UTF-8解析结果:', textContent)

      // 尝试进一步解析为JSON
      try {
        cacheRequest.body = JSON.parse(textContent)
      } catch (e) {
        console.log('非JSON格式文本')
      }
    } catch (e) {
      console.error('UTF-8解码失败:', e)
    }
  },
  { urls: ["https://www.temu.com/api/bg/circle/c/mall/newGoodsList*"] }, // 监听所有URL
  ["requestBody"] // 需要获取的信息
)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 根据请求类型处理不同逻辑
  if (request.action === "getCacheRequest") {
    // 发送响应
    sendResponse({
      data: cacheRequest
    })
  }
})
