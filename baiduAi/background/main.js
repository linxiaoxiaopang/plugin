chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'download') {
    const folder = `${formatTimestamp(Date.now())}_baidu_ai_图片`
    let { data } = message
    const pArr = data.map(item => {
      return new Promise(resolve => {
        const { title: fileName, resUrl: url } = item
        const filePath = `${folder}/${fileName}`
        chrome.downloads.download({ url: url, filename: filePath }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('下载出错:', chrome.runtime.lastError)
            resolve(false)
          } else {
            console.log('开始下载，下载 ID:', downloadId)
            resolve(true)
          }
        })
      })
    })
    Promise.all(pArr).then(res => {
      const success = res.every(Boolean)
      let tip = ''
      if (!data.length) {
        tip = '还未选择图片，请先选择图片。'
      } else if (success) {
        tip = '存在下载失败的图片，请仔细核对。'
      } else {
        tip = `共${pArr.length}张图片，已经开始下载了。文件夹名称是：${folder}`
      }
      const notificationOptions = {
        type: 'basic',
        iconUrl: 'icon32.png', // 确保路径正确
        title: 'temu预览图下载提示',
        message: tip
      }
      chrome.notifications.create(notificationOptions, function (notificationId) {
        if (chrome.runtime.lastError) {
          console.log('创建通知时出错:', chrome.runtime.lastError.message)
        } else {
          console.log('通知创建成功，ID 为:', notificationId)
        }
      })
      sendResponse({ status: 'success' })
    })
  }
  return true // 保持响应通道打开
})

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`
}
