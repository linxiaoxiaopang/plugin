// 监听请求发送事件，捕获请求头
let requestDetail = null
chrome.webRequest.onSendHeaders.addListener(
  async (details) => {
    const headers = details.requestHeaders.reduce((prev, cur) => {
      prev[cur.name] = cur.value
      return prev
    }, {})
    if (details.method == 'OPTIONS' || headers.isCustomHeader) return
    headers.isCustomHeader = 1
    details.allHeaders = headers
    requestDetail = details
  },
  { urls: getMatchUrls(['fcgi-bin/cgi_list_photo*pageStart=0*']) }, // 监听所有URL
  ["requestHeaders", "extraHeaders"] // 需要获取的信息
)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == 'download') {
    const { method, url, allHeaders } = requestDetail
    const config = {
      method,
      headers: allHeaders
    }
    getTotal(url, config).then(total => {
      return getAllPhotoList(url, config, total)
    }).then(res => {
      sendResponse({ data: res })
    })
  }
  return true
})

async function getTotal(url, config) {
  const res = await getData(url, config)
  return res?.data?.totalInAlbum
}

async function getAllPhotoList(url, config, total) {
  const data = []
  let pageStart = 0
  const urlInstance = new URL(url)
  const searchParams = urlInstance.searchParams
  const pageNum = +searchParams.get('pageNum')
  do {
    const res = await getData(url, config)
    const photoList = res?.data?.photoList || []
    if (!photoList.length) total = data.length
    data.push(...photoList)
    pageStart += pageNum
    searchParams.set('pageStart', pageStart)
    url = urlInstance.href
  } while (data.length < total)
  return data
}

async function getData(url, config) {
  const response = await fetch(url, config)
  const jsonP = await response.text()
  return parseJsonp(jsonP)
}


function parseJsonp(jsonpString) {
  try {
    // 1. 匹配函数名（如"shine0_Callback"）
    const funcNameMatch = jsonpString.match(/^(\w+)\(/)
    if (!funcNameMatch) {
      throw new Error("无法提取JSONP函数名")
    }

    // 2. 提取函数参数（JSON部分）
    const jsonStart = jsonpString.indexOf('(') + 1
    const jsonEnd = jsonpString.lastIndexOf(')')
    const jsonString = jsonpString.substring(jsonStart, jsonEnd)
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("执行JSONP失败：", error)
  }
}

function getMatchUrls(apiNameList) {
  const separatorCount = 8
  if (!Array.isArray(apiNameList)) apiNameList = [apiNameList]
  const tmpArr = []
  apiNameList.map(apiName => {
    const protocol = '*://'
    for (let i = 1; i <= separatorCount; i++) {
      const path = new Array(i).fill('*').join('/')
      tmpArr.push(`${protocol}${path}/${apiName}`)
    }
  })
  return tmpArr
}
