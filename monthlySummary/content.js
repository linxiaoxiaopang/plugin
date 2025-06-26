const totalRow = 2
const startRow = 3
const allotmentCol = 6
const accountCol = 7
const completionCol = 8
const difficultyCol = 9
const rowTotalCol = 12

// 浮点数求和
const accAdd = accFactory('plus')
// 浮点数相减
const accSub = accFactory('minus')
// 浮点数相除
const accDiv = accFactory('div')
// 浮点数相乘
const accMul = accFactory('times')

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendResponse('success')
  if (message.action === 'fillTable') {
    handleFillTable()
  }

  if (message.action === 'calculateTable') {
    handleCalculateTable()
  }
  return true
})

function handleFillTable() {
  const trs = getTrs()
  trs.map(item => {
    const tds = getTds(item)
    tds[accountCol].innerText = '1'
    tds[completionCol].innerText = '1'
    tds[difficultyCol].innerText = '0.75'
  })
}

function handleCalculateTable() {
  const trs = getTrs()
  const totalTd = getTds(getTotalRowTr())[rowTotalCol]
  let total = 0
  trs.map(item => {
    const tds = getTds(item)
    tds[rowTotalCol].innerText = accMul(tds[allotmentCol].innerText, tds[accountCol].innerText, tds[completionCol].innerText, tds[difficultyCol].innerText)
    total = accAdd(tds[rowTotalCol].innerText, total)
  })
  totalTd.innerText = `总分 ${total}`
}


function accFactory(method = 'plus') {
  return function (...nums) {
    nums = nums.map(Number).filter((num) => num || num === 0)
    if (nums.length < 2) return nums[0] || 0
    return Number(
      nums.slice(1).reduce((prev, num) => prev[method](num), new Big(nums[0]))?.toString()
    ) || 0
  }
}


function getTds(tr) {
  return toArray(tr.querySelectorAll('td'))
}

function getAllTrs() {
  const table = document.querySelector('#wysiwygTextarea_ifr').contentDocument.querySelector('.confluenceTable')
  return toArray(table.querySelectorAll('tr'))
}

function getTrs() {
  const trs = getAllTrs()
  return trs.slice(startRow)
}

function getTotalRowTr() {
  const trs = getAllTrs()
  return trs[totalRow]
}

function toArray(likeArray) {
  return [...likeArray]
}
