/* eslint-disable */
import { accAdd, accDiv, accMul, accSub } from '@/utils/calculate'
import { getUUID } from '@/utils/index'
import { isString, isUndefined, isArray, cloneDeep, flatten, groupBy, last, get } from 'lodash'
import JsBarcode from 'jsbarcode'
import { PT_PAPER_FORMATS } from '@/utils/constant/paperConst'

export function drawTable(clos, tableData, option) {
  let {
    createPdfInstance = {},
    pageHeight = (createPdfInstance.format || PT_PAPER_FORMATS.a4)[1],
    tableWidth,
    tdHeight,
    thHeight,
    paddingLeft = 20,
    paddingRight = 20,
    top = 10,
    left,
    right,
    fillColor = '#eee',
    spaceNum = 10,
    repeatCount = 1, //支持一行展示多次配置
    ossCompressedSize = 140
  } = option
  const tableTop = top
  left = left || paddingLeft
  right = right || paddingRight
  tableWidth = accSub(tableWidth, paddingLeft, paddingRight)
  const rawLeft = left
  const rawRight = right
  if (tableData.length <= repeatCount && tableData.length) repeatCount = tableData.length
  clos = createRepeatCols(clos)
  const flattenCols = flatten(clos)
  const colAutoWidth = getAutoWidth(flattenCols, tableWidth)
  clos = formatCols(clos)
  tableData = createRepeatTableData(tableData)
  const drawData = []
  drawHeader()
  drawTbody()
  spanMethod()
  return drawData

  function createRepeatTableData(tableData) {
    return tableData.reduce((cur, prev, index) => {
      const isEven = index % repeatCount == 0
      if (isEven) {
        cur.push([])
      }
      const lastArr = cur.slice(-1)[0]
      lastArr.push(prev)
      return cur
    }, [])
  }

  function createRepeatCols(cols) {
    return (new Array(repeatCount)).fill({}).map(() => {
      return cloneDeep(cols)
    })
  }

  function formatCols(clos) {
    let trLeft = rawLeft
    flatten(clos).map(item => {
      item.width = item.width || colAutoWidth
      item.left = trLeft
      step(item.width)
      return item
    })
    return clos

    function step(num) {
      return trLeft += num
    }
  }

  function stepH(height) {
    top += height
  }

  function drawHeader() {
    drawTr('tHeader', [], 0)
  }

  function drawTbody() {
    tableData.map((item, rowIndex) => {
      drawTr('tBody', item, rowIndex)
    })
  }
  
  function spanMethod() {
    const spanData = drawData.filter(item => item.cellOption?.type === 'tBody' && item.cellOption?.rowSpanId !== undefined)
    const spanGroup = groupBy(spanData, item => {
      const { cellOption } = item
      if (cellOption?.rowSpanId === undefined) return
      return `${ cellOption.tableIndex }_${ cellOption.rowSpanId }`
    })
    delete spanGroup['undefined']
    if (!Object.keys(spanGroup).length) return
    
    // tableTop对pageHeight取余
    const multiple = Math.floor(accDiv(tableTop, pageHeight))
    const remainder = accSub(tableTop, accMul(pageHeight, multiple)) // 表头距离当前页面顶部距离
    const bodyTop = accAdd(remainder, thHeight) // 表格body距离当前页面顶部距离
    const validHeight = accSub(pageHeight, bodyTop, createPdfInstance.pageNumHeight) // 第一页tBody最大高度
    const rowCount = Math.floor(accDiv(validHeight, tdHeight))
    const firstPageLastRowIndex = accSub(rowCount, 1) // 表格第一页最后一行行号
    // 第二页开始，整页都可以放表格
    // 第二页tBody最大高度
    const maxValidHeight = accSub(
      pageHeight,
      createPdfInstance.unitStartTop,
      thHeight,
      createPdfInstance.pageNumHeight
    )
    const onePageRowCount = Math.floor(accDiv(maxValidHeight, tdHeight)) // 每页最多行数
    let getPage = (cell) => {
      const rowIndex = get(cell, '[0].cellOption.rowIndex')
      if (rowIndex === undefined) return 0
      
      const index = rowIndex - firstPageLastRowIndex
      return index <= 0
        ? 0
        : accAdd(
          Math.floor(
            accDiv(
              accSub(index, 1),
              onePageRowCount
            )
          ),
          1
        )
    }
    for (const key in spanGroup) {
      const group = spanGroup[key]
      const cellGroup = groupBy(group, item => {
        const { cellOption } = item
        return `${ cellOption.rowIndex }_${ cellOption.columnIndex }`
      })
      const pageSpan = []
      for (const cellKey in cellGroup) {
        const cell = cellGroup[cellKey]
        const page = getPage(cell)
        if (!pageSpan[page]) pageSpan[page] = []
        pageSpan[page].push(cell)
      }
      for (const span of pageSpan) {
        if (!span?.length) continue

        const firstCell = span[0]
        const lastCell = last(span)
        const showCell = cloneDeep(firstCell)
        const pos = firstCell[0].cellOption || {}
        createPdfInstance.calcCellCenterPos(
          showCell,
          { ...pos, height: accMul(pos.height, span.length) }
        )
        const lastCellItem = last(lastCell)
        const lastCellItemIndex = drawData.findIndex(item => item === lastCellItem)
        if (lastCellItemIndex >= 0) drawData.splice(lastCellItemIndex + 1, 0, ...showCell)
        
        span.forEach((cell, index) => {
          const firstItem = cell[0]
          const { top, cellOption: { left: borderLeft, width } } = firstItem // 删除前取值
          cell.forEach((item) => {
            for (const key in item) {
              delete item[key]
            }
          })
          if (index === 0) return
          
          Object.assign(firstItem, {
            align: 'center',
            top: top - 1,
            height: 3,
            left: borderLeft + 2,
            rect: true,
            width: width - 3,
            fillColor: '#fff'
          })
        })
      }
    }
  }

  function getOptionByType(type) {
    const list = {
      tHeader: {
        cellHeight: thHeight,
        style: 'FD',
        slotName: 'headerSlot',
        typeName: 'headerType'
      },
      tBody: {
        cellHeight: tdHeight,
        style: 'S',
        slotName: 'slot',
        typeName: 'type'
      }
    }
    return list[type] || list.tBody
  }

  function drawTr(type, rowArr, rowIndex) {
    const { cellHeight, style, slotName, typeName } = getOptionByType(type)
    const optionType = type
    const closList = clos
    const tmpArr = []
    tmpArr.push({
      rect: true,
      validMark: true,
      top: top,
      right: rawRight,
      left: rawLeft,
      height: cellHeight,
      style,
      fillColor
    })
    closList.map((clos, colIndex) => {
      const row = rowArr[colIndex]
      clos.map((item, index) => {
        const { left, width, label, prop, image, isMultiple, gutter, cellHandler = val => val } = item
        const slot = item[slotName]
        const type = item[typeName]
        tmpArr.push(drawBorder(left, cellHeight))
        if (optionType === 'tBody' && !row) {
          return
        }
        const cellOption = {
          type: optionType,
          gutter,
          top,
          left,
          width,
          height: cellHeight,
          prop,
          row,
          rowIndex,
          columnIndex: index,
          tableIndex: colIndex
        }
        const defaultData = {
          left,
          top
        }
        const params = {
          rowIndex,
          columnIndex: index,
          column: item,
          row: row,
          pos: {
            left,
            centerLeft: accAdd(left, accDiv(width, 2)),
            top,
            width,
            height: cellHeight,
            spaceNum
          }
        }
        if (image && type == 'image') {
          params.image = image
        }
        let cell = []
        if (slot) {
          let slotDrawData = slot(params)
          if (!isArray(slotDrawData)) {
            slotDrawData = [slotDrawData]
          }
          slotDrawData = slotDrawData.map(slotItem => {
            return {
              ...defaultData,
              ...slotItem
            }
          })
          cell = slotDrawData
          if (isMultiple) {
            createPdfInstance.calcCellCenterPos(
              cell,
              cellOption
            )
          }
        } else if (type == 'image') {
          cell.push(drawImage(params))
        } else {
          const emptyText = typeof item?.emptyText == 'string' ? item.emptyText: '暂无' 
          const text = row ? $GET(row, prop, emptyText) : label
          cell.push(drawText(text, left, width, cellHeight))
        }
        tmpArr.push(
          ...cell.map(item => {
            item.cellOption = cellOption
            return cellHandler(item) || item
          })
        )
      })
    })

    stepH(cellHeight)
    pushStack(tmpArr)
  }

  function pushStack(value) {
    if (isArray(value)) {
      drawData.push(...value)
      return
    }
    drawData.push(value)
  }

  function getAutoWidth(cols, tableWidth) {
    const colsOfSetWidth = cols.filter(item => !isUndefined(item.width))
    const autoColsLen = cols.length - colsOfSetWidth.length
    const totalOfColsOfSetWidth = colsOfSetWidth.reduce((cur, prev) => {
      cur += prev.width
      return cur
    }, 0)
    return accDiv(accSub(tableWidth, totalOfColsOfSetWidth), autoColsLen)
  }

  function drawImage(params) {
    const { min } = Math
    let { image, column, row, pos } = params
    const imageOption = {
      left: accAdd(pos.left, accDiv(pos.width, 2))
    }
    if (!image) image = row[column.prop] || $DEFAULT_PIC
    if (!image) return
    if (isString(image)) {
      image = {
        url: image
      }
    }
    if (!isUndefined(image.ossCompressedSize)) {
      ossCompressedSize = image.ossCompressedSize
    }
    if (ossCompressedSize && image.url != $DEFAULT_PIC) {
      image.url = aLiCompressPicByUrl(image.url, ossCompressedSize)
    }
    if (!image.width && !image.height) {
      const minSize = accSub(min(pos.width, pos.height), spaceNum)
      image.width = minSize
      image.height = minSize
    }
    imageOption.image = image
    imageOption.top = accSub(accAdd(pos.top, accDiv(pos.height, 2)), accDiv(image.height, 2))
    return imageOption
  }

  function drawText(text, left, tdW, tdH) {
    return {
      top,
      text: text,
      left: accAdd(left, accDiv(spaceNum, 2), -2, accDiv(tdW, 2)),
      align: 'center',
      textOption: { maxWidth: accSub(tdW, spaceNum), yMove: accDiv(tdH, 2) }
    }
  }

  function drawBorder(left, height) {
    return { rect: true, left, top, width: 1, height, fillColor: '#eee' }
  }
}

export function getBarCode(text, height = 60, displayValue = false) {
  const img = document.createElement('img')
  img.id = 'barCode' + getUUID()
  JsBarcode(img, text, {
    height,
    displayValue
  })
  return img
}

export function getQrCanvas(text, size = 60) {
  return new AraleQRCode({
    text: text + '',
    size
  })
}
