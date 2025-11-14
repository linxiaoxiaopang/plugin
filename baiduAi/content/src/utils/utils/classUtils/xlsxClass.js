/* eslint-disable */
import * as XLSX from 'xlsx'
// import * as XLSX from 'xlsx-js-style' // 想设置单元格样式需要引入这个库
import { cloneDeep, merge, isPlainObject, pick } from 'lodash'
import { compose, validatenull } from '@/components/avue/utils/validate'
import { validData } from '@/components/avue/utils/util'

export class XlsxClass {
  constructor(option = {}) {
    this.option = option
  }
  static writeFile(option = {}) {
    let { data, column, sheetName = 'sheet', filename = '表格' } = option
    if (validatenull(column)) throw 'column无数据'
    
    const { header, headerKeys, headerLength, merges, cols } = XlsxClass.getHeader(column, option)
    // console.log(_.cloneDeep({ header, headerKeys, headerLength, merges }))
    
    // 将JS数据数组转换为工作表。
    let ws = XLSX.utils.aoa_to_sheet(header)
    // console.log('ws', ws)
    if (!validatenull(data)) {
      // 举例：headerKeys = ['A', 'B', 'C'], data = [{ A: 5, B: 6, C: 7 }, { A: 6, B: 7, C: 8 }, { A: 7, B: 8, C: 9 }]
      data = data.map(row => pick(row, headerKeys))
      ws = XLSX.utils.sheet_add_json(ws, data, {
        header: headerKeys,
        skipHeader: true,
        origin: `A${ headerLength + 1 }`
      })
    }
    // 设置单元格合并信息
    ws['!merges'] = merges
    // 列宽
    ws['!cols'] = cols
    // console.log('ws', ws)
    
    /* 新建空的工作表 */
    const wb = XLSX.utils.book_new()
    // console.log('wb', wb)
    
    // 可以自定义下载之后的sheetname
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    /* 生成xlsx文件 */
    XLSX.writeFile(wb, `${ filename }.xlsx`)
  }
  static getHeader(column, { s, width }) {
    return compose(handler, calcSpan, cloneDeep)(column)
    function calcSpan(column) {
      calcColspan(column)
      calcRowspan(column)
      // console.log('calcSpan', column)
      return column
      
      function calcColspan(column, columnIndex = 0) {
        let columnLength = 0 // 当前行的总列数，如果存在父级则为父级的colspan
        for (const el of column) {
          // 下一个el的columnIndex为上一个el的colspan + columnIndex
          el.columnIndex = columnIndex
          // 有children时，el的colspan为子项的colspan总和
          el.colspan = validatenull(el.children) ? 1 : calcColspan(el.children, el.columnIndex)
          columnLength += el.colspan
          columnIndex += el.colspan
        }
        return columnLength
      }
      // 由于每列都可能存在不同层级的children，导致每列的层级不一致，所以每列最后一级需要合并行，rowspan = headerLength - el.rowIndex
      function calcRowspan(column) {
        const headerLength = getLastHeaderIndex(column) + 1
        handler(column)
        
        function handler(column) {
          for (const el of column) {
            if (validatenull(el.children)) {
              // 合并行数为表头长度 - 当前行号
              el.rowspan = headerLength - el.rowIndex
            } else {
              el.rowspan = 1
              handler(el.children)
            }
          }
        }
      }
      // 每列都可能存在不同层级的children，获取所有children的行号集合，取最大值，即为最后一行表头的行号
      function getLastHeaderIndex(column, rowIndex = 0) {
        const rowIndexes = [rowIndex] // 元素及元素子项的行号集合
        for (const el of column) {
          el.rowIndex = rowIndex
          if (!validatenull(el.children)) {
            rowIndexes.push(
              getLastHeaderIndex(el.children, rowIndex + 1)
            )
          }
        }
        
        return Math.max(...rowIndexes)
      }
    }
    function handler(column, result = { header: [], headerKeys: [], merges: [], headerLength: 0, cols: [] }) {
      const { header, headerKeys, merges, cols } = result
      for (const el of column) {
        for (let i = 0; i < el.rowspan; i++) {
          const rowIndex = el.rowIndex + i
          if (!header[rowIndex]) header[rowIndex] = []
          for (let j = 0; j < el.colspan; j++) {
            header[rowIndex][el.columnIndex + j] = { v: el.label, t: 's', s: merge({}, s, el.s) }
            cols[el.columnIndex + j] = XlsxClass.getCellCols(el, width)
          }
        }
        if (el.rowspan > 1 || el.colspan > 1) {
          merges.push({
            s: { r: el.rowIndex, c: el.columnIndex },
            e: { r: el.rowIndex + el.rowspan - 1, c: el.columnIndex + el.colspan - 1 }
          })
        }
        
        if (!validatenull(el.children)) {
          handler(el.children, result)
        } else {
          headerKeys.push(el.prop)
          result.headerLength = Math.max(result.headerLength, el.rowIndex + 1)
        }
      }
      return result
    }
  }
  static getCellCols(el, width) {
    width = validData(el.width, width)
    if (isPlainObject(width)) return width
    if (!validatenull(width)) return { wpx: width }
    return { wch: XlsxClass.getCellWidth(el.label) }
  }
  static getCellWidth(value) {
    // 判断是否为null或undefined
    if (value == null) {
      return 10;
    } else if (/.*[\u4e00-\u9fa5]+.*$/.test(value)) {
      // 中文的长度
      const chineseLength = value.match(/[\u4e00-\u9fa5]/g).length;
      // 其他不是中文的长度
      const otherLength = value.length - chineseLength;
      return chineseLength * 2.1 + otherLength * 1.1;
    } else {
      return value.toString().length * 1.1;
      /* 另一种方案
       value = value.toString()
       return value.replace(/[\u0391-\uFFE5]/g, 'aa').length
       */
    }
  }
}