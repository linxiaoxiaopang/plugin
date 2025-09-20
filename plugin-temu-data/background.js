// 监听请求发送事件，捕获请求

const cacheRequest = {
  headers: null,
  body: null
}

class Storage {
  static get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key])
      })
    })
  }

  static set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve(true)
      })
    })
  }
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
const NEW_GOODS_LIST_KEY = 'new_goods_list_key'

const actionList = {
  async getCacheRequest() {
    return cacheRequest
  },

  async getStorage(request) {
    const { key } = request.data
    return await Storage.get(key)
  },

  async setStorage(request) {
    const { key, data } = request.data
    return await Storage.set(key, data)
  },

  async getNewGoodsList() {
    const data = await Storage.get(NEW_GOODS_LIST_KEY)
    if (Object.keys(data || {}).length) return data
    return {
      pageNumber: 1,
      nextPageNumber: 1,
      pageSize: 0,
      finish: false,
      list: [],
      time: Date.now()
    }
  },

  async setNewGoodsList(request) {
    const { data: row } = request.data
    const data = await actionList.getNewGoodsList()
    data.pageSize = row.pageSize
    data.pageNumber = row.pageNumber
    data.nextPageNumber = row.pageNumber + 1
    data.finish = row.finish
    data.time = Date.now()
    const rowData = row.data || []
    data.list.push(...rowData)
    await Storage.set(NEW_GOODS_LIST_KEY, data)
  },

  async clearNewGoodsList() {
    await Storage.set(NEW_GOODS_LIST_KEY, {})
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 根据请求类型处理不同逻辑
  const action = request.action
  if (actionList[action]) {
    actionList[action](request).then(res => {
      sendResponse({
        data: res
      })
    })
  }
  return true
})
