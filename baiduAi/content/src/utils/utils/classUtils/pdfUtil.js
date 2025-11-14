/* eslint-disable */
import Vue from 'vue'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import { accAdd, accDiv, accMul, accSub, aLiCompressPicByUrl, getBinaryString, waitTimeByNum } from '@/utils'
import {
  isUndefined,
  isNil,
  min,
  isArray,
  uniq,
  isPlainObject,
  find,
  cloneDeep
} from 'lodash'
import { validData } from '@/components/avue/utils/util'
import { PT_PAPER_FORMATS } from '@/utils/constant/paperConst'
import { downloadFile } from '@/utils/download'
import { validatePipe } from '@/components/avue/utils/validate'

const DEFAULT_COLOR = '#000'
const DEFAULT_FONT_SIZE = 8
const ACTIVE_COLOR = 'red'

const DEFAULT_JSPDF_OPTION = {
  unit: 'pt',
  format: 'a4'
}

const DEFAULT_TEXT_OPTION = {
  pt: DEFAULT_FONT_SIZE
}

export const CreatePdf = class CreatePdf {
  constructor(
    {
      pdfMethod = 'print',
      pdfFileOption = {},
      jsPdfOption = {},
      defaultTextOption = {},
      defaultColor = DEFAULT_COLOR,
      defaultFontSize = DEFAULT_FONT_SIZE,
      topStep = 0,
      unitStartTop = 0,
      textAlign = 'center',
      validUnitOverOnePage = false, //校验是否一个单元会超过一页
      onlyValidMarkItem = false, //是否只校验标记元素
      needCloneData = false,
      fillTableHeader = null,
      showPageNum = false
    }
  ) {
    const option = CreatePdf.formatJsPdfOption(jsPdfOption)
    this.doc = new jsPDF(option)
    this.format = CreatePdf.getArrayFormat(option.format)
    this.topStep = topStep
    this.totalPosTop = 0
    this.totalPosLeft = 0
    this.defaultColor = defaultColor
    this.defaultFontSize = defaultFontSize
    this.defaultTextOption = defaultTextOption
    this.textAlign = textAlign
    this.unitStartTop = unitStartTop
    this.validUnitOverOnePage = validUnitOverOnePage
    this.onlyValidMarkItem = onlyValidMarkItem
    this.needCloneData = needCloneData
    this.fillTableHeader = fillTableHeader
    this.showPageNum = showPageNum
    this.pdfMethod = pdfMethod
    this.pdfFileOption = pdfFileOption
  }
  
  get pageNumHeight() {
    return this.showPageNum ? 20 : 0
  }
  
  static formatJsPdfOption(jsPdfOption) {
    return Object.assign({}, DEFAULT_JSPDF_OPTION, jsPdfOption)
  }
  
  static getArrayFormat(format) {
    if (isArray(format)) return format
    return validData(PT_PAPER_FORMATS[format], PT_PAPER_FORMATS.a4)
  }
  
  formatImageProps(imageProps) {
    if (!isArray(imageProps)) imageProps = [imageProps]
    return imageProps.map(item => {
      if (!isPlainObject(item)) item = { path: item }
      if (!item.ossSuffix) item.ossSuffix = aLiCompressPicByUrl(150)
      return item
    })
  }
  
  async loadAllImage(originData) {
    let { imageProps, list } = originData
    const afterFormatImageProps = this.formatImageProps(imageProps)
    let defaultData = await this.getURLUint8Array(window.$DEFAULT_PIC)
    const imageList = list.reduce((cur, next) => {
      afterFormatImageProps.map(image => {
        const { path, ossSuffix } = image
        if (next[path]) {
          cur.push(getThumbnailPath(next[path], ossSuffix))
        } else {
          cur.push(window.$DEFAULT_PIC)
        }
      })
      return cur
    }, [])
    const uniqImageList = uniq(imageList)
    const pArr = uniqImageList.map(async url => {
      return {
        url,
        data: await this.getURLUint8Array(url) || defaultData
      }
    })
    return await Promise.all(pArr)
  }
  
  getURLUint8Array(url) {
    return axios.get(url, {
      responseType: 'arraybuffer'
    }).then(res => {
      const { status, data } = res || {}
      if (status >= 200 && status < 300) {
        return new Uint8Array(data)
      }
    }).catch(err => {
      console.log('err', err)
      return null
    })
  }
  
  async action(data, originData) {
    const doc = this.doc
    if (this.needCloneData) data = cloneDeep(data)
    doc.setFontSize(this.defaultFontSize)
    await this.loadFont(doc)
    let uint8ArrayList = null
    if (originData) uint8ArrayList = await this.loadAllImage(originData)
    const pArr = this.fillDataToPdf(data, uint8ArrayList)
    this.drawPageNum()
    await Promise.all(pArr)
    uint8ArrayList = null
    await waitTimeByNum(50)
    const printable = doc.output('bloburi')
    return this.pdfHandler(printable)
  }
  
  // 初始化doc
  init() {
    if (this.initResult) return this.initResult
    return this.initResult = validatePipe(
      this.checkFont.bind(this)
    ).then(() => this.initResult = true)
  }
  
  pdfHandler(printable) {
    const handler = {
      print: async (printable) => {
        const [err, res] = await Vue.prototype.$lodopPrintPdf({
          printable
        })
        //存在错误抛出错误
        if (err) {
          this.$message.error('打印错误')
          throw new Error('打印错误')
        }
        return res
      },
      download: (printable) => {
        return downloadFile(printable, this.pdfFileOption.name, this.pdfFileOption.suffix)
      }
    }[this.pdfMethod]
    return handler(printable)
  }
  
  /**
   * 计算自适应高度  文本换行
   * @param row
   * @param data
   */
  calcAutoHeight(row, data) {
    const { text, calcHeight, maxWidth, fontSize, textOption = {} } = row
    const calcHeightOption = isPlainObject(calcHeight) ? { ...calcHeight } : {}
    calcHeightOption.maxWidth = validData(calcHeightOption.maxWidth, textOption?.maxWidth, maxWidth, undefined)
    let dirTop = 0
    if (text) {
      const oneLineHeight = this.getTextHeight(text.slice(0, 1), fontSize, calcHeightOption)
      const height = this.getTextHeight(text, fontSize, calcHeightOption)
      dirTop = height - oneLineHeight
    }
    if (!dirTop) return
    //更新后续的偏移量
    data.forEach(item => {
      if (isNaN(+item.top)) return
      item.top += dirTop
    })
  }
  
  // fillDataToPdf(data, uint8ArrayList) {
  //   const { doc, format } = this
  //   data.map((list, index) => {
  //     if (index != 0) doc.addPage(format)
  //     list.map((item, sIndex) => {
  //       item = this.formatItemData(item)
  //       //存在高度auto情况，自动计算高度
  //       if (item.calcHeight) {
  //         this.calcAutoHeight(item, list.slice(sIndex))
  //       }
  //       //单个单元是否存在超过一页的情况，开启分页校验
  //       if (this.validUnitOverOnePage) {
  //         const isOverflow = this.validOverCurrentPage(item)
  //         if (isOverflow) {
  //           this.addPage() //新增一页
  //           this.updateTopPos(item, list.slice(sIndex))
  //         }
  //       }
  //       const { text, image, rect, line, callback } = item
  //       if (callback) return callback({ data, list, item, index, sIndex }, this)
  //       if (rect) return this.drawRect(item)
  //       if (line) return this.drawLine(item)
  //       if (!isNil(text)) return this.createText(item)
  //       if (image) return this.drawImage(item, uint8ArrayList)
  //     })
  //   })
  // }
  
  /**
   * //在一定宽高内显示最大的字号
   * @param item
   */
  updateFontSizeToLarge(item) {
    const { doc } = this
    const { text } = item
    const textOption = item.textOption = this.formatMaxWidth($GET(item, 'textOption', {}))
    const { maxWidth, fontSizeToLarge } = textOption
    const textMaxHeight = $GET(textOption, 'maxHeight', this.format[1])
    if (!textMaxHeight) return
    if (fontSizeToLarge && maxWidth) {
      let defaultFontSize = doc.getFontSize()
      let rawFontSize = item.fontSize || defaultFontSize
      let curFontSize = rawFontSize
      let fontSize = rawFontSize
      let { w, h } = this.getTextSize(text, fontSize, textOption)
      if (w < maxWidth && h < textMaxHeight) {
        do {
          const size = this.getTextSize(text, fontSize, textOption)
          w = size.w
          h = size.h
          fontSize = curFontSize
          curFontSize = curFontSize + 1
          doc.setFontSize(curFontSize)
        } while (w < maxWidth - 10 && h < textMaxHeight)
      } else if (w > maxWidth || h > textMaxHeight) {
        do {
          const size = this.getTextSize(text, fontSize, textOption)
          w = size.w
          h = size.h
          fontSize = curFontSize
          curFontSize = curFontSize - 1
          doc.setFontSize(curFontSize)
        } while (w > maxWidth || h > textMaxHeight)
      }
      item.fontSize = fontSize
      item.textOption = textOption
      doc.setFontSize(defaultFontSize)
    }
  }
  
  fillDataToPdf(data, uint8ArrayList) {
    const { doc, format } = this
    return data.map(async (list, index) => {
      if (index != 0) doc.addPage(format)
      for (let sIndex = 0; sIndex < list.length; sIndex++) {
        let item = list[sIndex]
        if (!item.isFormt) {
          item = this.formatItemData(item)
        }
        //在一定宽高内显示最大的字号
        if ($GET(item, 'textOption.fontSizeToLarge', false)) {
          this.updateFontSizeToLarge(item)
        }
        //存在高度auto情况，自动计算高度
        if (item.calcHeight) {
          this.calcAutoHeight(item, list.slice(sIndex))
        }
        //单个单元是否存在超过一页的情况，开启分页校验
        if (this.validUnitOverOnePage && !item.ignore) {
          let isOverflow = false
          if (this.onlyValidMarkItem && item.validMark || !this.onlyValidMarkItem) {
            isOverflow = this.validOverCurrentPage(item)
          }
          if (isOverflow) {
            this.addPage() //新增一页
            if (this.fillTableHeader) {
              const { tableHeaderData, tableHeaderHeight, fill = true } = this.fillTableHeader(item.top, this, item)
              if (fill) {
                list.slice(sIndex).map(ssItem => {
                  if (!isUndefined(ssItem.top)) ssItem.top += tableHeaderHeight
                })
                list.splice(sIndex, 0, ...tableHeaderData)
                item = this.formatItemData(list[sIndex])
              }
            }
            this.updateTopPos(item, list.slice(sIndex))
          }
        }
        const { text, image, rect, line, callback } = item
        if (callback) {
          callback({ data, list, item, index, sIndex }, this)
          continue
        }
        if (rect) {
          this.drawRect(item)
          continue
        }
        if (line) {
          this.drawLine(item)
          continue
        }
        if (!isNil(text)) {
          this.createText(item)
          continue
        }
        if (image) {
          this.drawImage(item, uint8ArrayList)
        }
      }
      if (index % 100 == 0) {
        await waitTimeByNum(20)
      } else if (index >= data.length) {
        await waitTimeByNum(20)
      }
    })
  }
  
  //更新top的位置
  updateTopPos(layer, data) {
    const originLayerTop = layer.top
    if (!originLayerTop) return
    this.totalPosTop = this.unitStartTop
    layer.top = this.unitStartTop
    data.forEach(item => {
      if (isNaN(+item.top)) return
      item.top = item.top - originLayerTop + this.unitStartTop
    })
  }
  
  addPage() {
    const { doc, format } = this
    doc.addPage(format)
  }
  previousPage() {
    const { pageNumber } = this.doc.getCurrentPageInfo()
    this.doc.setPage(pageNumber - 1)
  }
  nextPage() {
    const { pageNumber } = this.doc.getCurrentPageInfo()
    this.doc.setPage(pageNumber + 1)
  }
  
  drawPageNum() {
    const { doc, showPageNum } = this
    if (!showPageNum) return
    const pageTotal = doc.getNumberOfPages()
    for (let i = 1; i <= pageTotal; i++) {
      doc.setPage(i)
      this.createText({
        left: this.format[0] - 20,
        align: 'right',
        fontSize: 12,
        top: this.format[1] - this.pageNumHeight,
        text: `${i}/${pageTotal}`
      })
    }
  }
  
  /**
   * 校验是否超过当前活动页
   * @param layer
   * @returns {boolean}
   */
  validOverCurrentPage(layer) {
    const { format, totalPosTop } = this
    const docHeight = format[1] - this.pageNumHeight
    const { line, text, image, top, height, lineWidth = 1, fontSize, textOption = {} } = layer
    let calcTop = validData(top, totalPosTop)
    if (height) {
      calcTop += height
    } else if (image) {
      calcTop += validData(image.height, 0)
    } else if (line) {
      calcTop += validData(lineWidth, 1)
    } else if (text) {
      calcTop += this.getTextHeight(text, fontSize, textOption)
    }
    if (textOption.isOverflow) return textOption.isOverflow({ instance: this, item: layer, calcTop, docHeight })
    return calcTop / docHeight > 1
  }
  
  async loadFont() {
    const myFont = await getBinaryString('/fonts/simhei.ttf')
    this.doc.addFileToVFS('simhei.ttf', myFont)
    this.doc.addFont('simhei.ttf', 'simhei', 'normal')
    this.doc.setFont('simhei')
  }
  
  getPosByAlignType({ image, text, align, left, top, marginLeft, marginTop, maxWidth }) {
    if (!isUndefined(left)) this.totalPosLeft = left
    if (!isUndefined(top)) this.totalPosTop = top
    if (marginLeft) this.totalPosLeft += marginLeft
    if (marginTop) this.totalPosTop += marginTop
    if (isUndefined(top) && isUndefined(marginTop)) {
      this.totalPosTop += this.topStep
    }
    const posL = this.transformPosByAlign({ align, image, text, totalPosLeft: this.totalPosLeft, maxWidth })
    return {
      posL: posL,
      posT: this.totalPosTop
    }
  }
  
  getContentHeight(item) {
    let type
    const { text, image } = item
    if (!isNil(text)) {
      type = 'text'
    }
    if (image) {
      type = 'image'
    }
    const options = {
      text: () => {
        const { fontSize, textOption } = item
        if (!this.isCheckFont) {
          return this.checkFont(fontSize).then(res => {
            return options.text()
          })
        }
        return this.getTextHeight(text, fontSize, textOption) || 0
      },
      image: () => {
        const { image } = item
        return image?.height || 0
      }
    }
    return options[type]?.()
  }
  async checkFont(fontSize = this.defaultFontSize) {
    this.doc.setFontSize(fontSize)
    if (!this.checkFontPromise) {
      this.checkFontPromise = this.loadFont(this.doc)
      await this.checkFontPromise
      this.isCheckFont = true
    }
    return this.checkFontPromise
  }
  
  /**
   * 获取文本高度
   * @param text
   * @param textOption
   * @returns {number}
   */
  getTextHeight(text, fontSize, textOption = {}) {
    const doc = this.doc
    const maxWidth = validData(textOption.maxWidth, this.format[0])
    if (textOption.height) { //自定义行高
      const lines = doc.splitTextToSize(text, maxWidth)
      return lines.length * textOption.height
    }
    const font = doc.getFont()
    fontSize = validData(fontSize, this.defaultFontSize)
    return  doc.getTextDimensions(text, Object.assign({}, font, { maxWidth, fontSize })).h // 获取行高
  }
  
  getTextSize(text, fontSize, textOption) {
    const doc = this.doc
    const font = doc.getFont()
    fontSize = validData(fontSize, this.defaultFontSize)
    return doc.getTextDimensions(text, Object.assign({}, font, { fontSize })) // 获取行高
  }
  
  transformPosByAlign({ align, text, image, rect, totalPosLeft, maxWidth }) {
    let width = 0
    if (text) width = this.doc.getTextWidth(text + '')
    if (image) width = image.width
    if (rect) width = rect.width
    const docWidth = this.format[0]
    let formatWidth = !maxWidth ? min([docWidth, width]) : min([docWidth, width, maxWidth])
    const typeList = {
      left: totalPosLeft,
      center: totalPosLeft - formatWidth / 2,
      right: totalPosLeft - formatWidth,
      default: totalPosLeft - formatWidth / 2
    }
    return validData(typeList[align], typeList.default)
  }
  
  formatNum(num) {
    if (!num) return num
    const strNum = num + ''
    const isMatch = strNum.match(/.+%$/g)
    if (!isMatch) return num
    const parseNum = parseFloat(strNum)
    return (parseNum / 100) * this.format[0]
  }
  
  formatItemData(item) {
    const formatItem = Object.assign({}, DEFAULT_TEXT_OPTION, item)
    if (formatItem.text) formatItem.text = formatItem.text + ''
    const props = ['left', 'top', 'marginTop', 'marginLeft']
    props.map((prop) => {
      formatItem[prop] = this.formatNum(formatItem[prop])
    })
    return formatItem
  }
  
  drawLine(item) {
    const doc = this.doc
    let { left = 0, top, width, lineWidth = 1, drawColor, style = 'FD', right = 0 } = item
    width = width || this.format[0] - right
    if (drawColor) doc.setDrawColor(drawColor)
    if (lineWidth) doc.setLineWidth(lineWidth)
    doc.line(left, top, width, top, style)
  }
  
  drawRect(item) {
    const doc = this.doc
    let {
      align,
      fillColor,
      width,
      height,
      drawColor,
      style = 'FD',
      left = 0,
      right = 0,
      top,
      marginTop,
      marginLeft
    } = item
    width = width || this.format[0] - (left + right)
    const rectOption = {
      width,
      height
    }
    const { posL, posT } = this.getPosByAlignType({
      rect: rectOption,
      align,
      left,
      top,
      marginTop,
      marginLeft
    })
    
    drawColor = drawColor || fillColor
    
    if (fillColor) doc.setFillColor(fillColor)
    if (drawColor) doc.setDrawColor(drawColor)
    doc.rect(posL, posT, width, height, style)
  }
  
  formatMaxWidth(textOption) {
    if (!textOption.maxWidth) textOption.maxWidth = this.format[0]
    if ((textOption.maxWidth + '').indexOf('%') >= 0) {
      const parseMaxWidth = parseFloat(textOption.maxWidth)
      textOption.maxWidth = accMul((accDiv(parseMaxWidth, 100)), this.format[0])
    }
    return textOption
  }
  
  createText(item) {
    let { text, color, fontSize, align, left, top, marginTop, marginLeft, textOption = {} } = item
    align = validData(align, this.textAlign)
    const doc = this.doc
    if (color) doc.setTextColor(color)
    if (fontSize) doc.setFontSize(fontSize)
    textOption = item.textOption = this.formatMaxWidth(textOption)
    let { posL, posT } = this.getPosByAlignType({
      text,
      align,
      left,
      top,
      marginTop,
      marginLeft,
      maxWidth: textOption.maxWidth
    })
    if (textOption.yMove) {
      const textHeight = this.getTextHeight(text, fontSize, textOption)
      posT = accSub(accAdd(posT, textOption.yMove), accDiv(textHeight, 2))
    }
    doc.text(text, posL, posT, Object.assign({}, this.defaultTextOption, textOption))
    if (color) doc.setTextColor(this.defaultColor)
    if (fontSize) doc.setFontSize(this.defaultFontSize)
  }
  
  drawImage(item, uint8ArrayList) {
    const {
      align,
      left,
      top,
      marginTop,
      marginLeft,
      image,
      imageType = 'PNG',
      imageOption = {}
    } = item
    const { posL, posT } = this.getPosByAlignType({
      image,
      align,
      left,
      top,
      marginTop,
      marginLeft
    })
    let drawDom = null
    if (image.url) {
      drawDom = image.url
      if (uint8ArrayList) {
        const fItem = find(uint8ArrayList, (item) => {
          return item.url.split('?')[0] === image.url
        })
        if (isPlainObject(fItem)) drawDom = fItem.data
      }
    }
    if (image.callback) image.callback(item, image, this)
    if (image.dom) drawDom = image.dom
    image.dom = null
    try {
      this.doc.addImage(drawDom, imageType, posL, posT, image.width, image.height)
    } catch {
      this.doc.addImage(window.$DEFAULT_PIC, 'PNG', posL, posT, image.width, image.height)
    }
    this.totalPosTop += image.height
  }
  
  // 计算单元格内容的居中位置
  // 前置方法：init（执行该方法前需先执行以上方法）
  calcCellCenterPos(cell, option) {
    const initResult = this.init()
    if (initResult instanceof Promise) {
      return initResult.then(() => this.calcCellCenterPos(cell, option))
    }
    
    const { top, height, centerY = height / 2, gutter = 0 } = option || {}
    const heightList = cell.map(item => this.getContentHeight(item))
    const totalGutter = accMul(accSub(cell.length, 1), gutter)
    const topOffset = cell.reduceRight((prev, next, index) => {
      if (index === 0) return prev
      return accAdd(
        prev,
        accSub(next.top, cell[index - 1].top)
      )
    }, 0)
    const contentHeight = accAdd(...heightList, totalGutter, topOffset)
    // 内容整体下移至中心点，再上移一半内容高度，即可实现居中
    const offsetY = accSub(centerY, accDiv(contentHeight, 2))
    cell.forEach((item, index) => {
      const prevItemTotalHeight = accAdd(...heightList.slice(0, index))
      item.top = accAdd(
        validData(item.top, top),
        prevItemTotalHeight,
        accMul(validData(item.cellOption?.gutter, gutter), index),
        offsetY
      )
    })
    return cell
  }
}

function getThumbnailPath(url, ossSuffix = aLiCompressPicByUrl(150)) {
  return url.split(' ')[0] + ossSuffix
}
