let fillButton = null
let calculateButton = null

document.addEventListener('DOMContentLoaded', async function () {
  fillButton = document.getElementById('fill-button')
  calculateButton = document.getElementById('calculate-button')
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  fillButton.addEventListener('click', async function () {
    // 向content.js发送消息
    chrome.tabs.sendMessage(tab.id, { action: 'fillTable' }, response => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        return
      }
    })
  })

  calculateButton.addEventListener('click', function () {
    chrome.tabs.sendMessage(tab.id, { action: 'calculateTable' }, response => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        return
      }
    })
  })
})

