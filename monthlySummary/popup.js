let allotmentButton = null
let fillButton = null
let calculateButton = null
let workflowButton = null

document.addEventListener('DOMContentLoaded', async function () {
  allotmentButton = document.getElementById('fill-allotment')
  fillButton = document.getElementById('fill-button')
  calculateButton = document.getElementById('calculate-button')
  workflowButton = document.getElementById('workflow-button')
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  allotmentButton.addEventListener('click', function () {
    // 向content.js发送消息
    chrome.tabs.sendMessage(tab.id, { action: 'allotment' })
  })


  fillButton.addEventListener('click', function () {
    // 向content.js发送消息
    chrome.tabs.sendMessage(tab.id, { action: 'fillTable' })
  })

  calculateButton.addEventListener('click', function () {
    chrome.tabs.sendMessage(tab.id, { action: 'calculateTable' })
  })

  workflowButton.addEventListener('click', async function () {
    chrome.tabs.sendMessage(tab.id, { action: 'allotment' })
    await wait(200)
    chrome.tabs.sendMessage(tab.id, { action: 'fillTable' })
    await wait(200)
    chrome.tabs.sendMessage(tab.id, { action: 'calculateTable' })
  })
})

function wait(time = 100) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, time)
  })
}

