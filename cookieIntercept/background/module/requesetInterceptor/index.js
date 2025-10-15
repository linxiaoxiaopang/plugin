// 监听请求发送事件，捕获请求头

chrome.webRequest.onSendHeaders.addListener(
  async (details) => {
    // 构建请求信息对象
    if (details.method == 'OPTIONS') return
    const agentHeaders = details.requestHeaders.reduce((prev, cur) => {
      prev[cur.name] = cur.value
      return prev
    }, {})
    await setHeaders(agentHeaders)
  },
  // { urls: getMatchUrls(['userInfo']) }, // 监听所有URL
  { urls: ['https://agentseller.temu.com/api/seller/auth/userInfo', 'https://agentseller-us.temu.com/api/seller/auth/userInfo'] }, // 监听所有URL
  ["requestHeaders", "extraHeaders"] // 需要获取的信息
)


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


async function setHeaders(agentHeaders) {
  const response = await fetch('http://localhost:3000/setHeaders', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      headers: agentHeaders
    })
  })
  return response.json()
}
