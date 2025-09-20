async function exportExcel(data, fileName) {
  const exceljsUrl = chrome.runtime.getURL('./exceljs.min.js')
  await import(exceljsUrl)
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')
  // 示例 JSON 数据，新增了图片列
  const jsonData = data
  const keyMap = {
    title: 'title',
    marketPrice: 'marketPrice',
    price: 'price',
    salesNum: 'salesNum',
    url: 'url',
    link: 'link'
  }
  const tableData = jsonData.map(item => {
    const tmpObj = {}
    Object.keys(keyMap).map(key => {
      tmpObj[keyMap[key]] = item[key]
    })
    return tmpObj
  })
  // 添加表头
  const headers = Object.values(keyMap)
  worksheet.addRow(headers)
  // 异步处理图片并添加表格数据
  for (let i = 0; i < tableData.length; i++) {
    const rowData = tableData[i]
    const rowValues = headers.map(header => rowData[header])
    worksheet.addRow(rowValues)
  }
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${formatTimestamp(Date.now())}_${fileName}.xlsx`)
}


function saveAs(obj, fileName) {
  var tmpa = document.createElement('a')
  tmpa.download = fileName || '下载'
  tmpa.href = URL.createObjectURL(obj)
  tmpa.click()
  setTimeout(function () {
    URL.revokeObjectURL(obj)
  }, 100)
}

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

export default exportExcel
