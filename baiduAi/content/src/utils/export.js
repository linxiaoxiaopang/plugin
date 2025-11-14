/* eslint-disable */
import * as XLSX from 'xlsx'
import { map, uniq } from 'lodash'
import { Message } from 'element-ui'
import saveAs from 'jszip/vendor/FileSaver.js'
import { validatenull } from '@/components/avue/utils/validate'
import { downloadFile } from '@/utils/download'

/*const data = [
  { key: 1, name: 'zhangsan', value: '123' },
  { key: 2, name: 'lisi', value: '456' }
]
const column = [
  {
    label: '编号',
    prop: 'key'
  },
  {
    label: '姓名',
    prop: 'name'
  },
  {
    label: '电话',
    prop: 'value'
  }
]*/
// 将数据导出到excel表格里
export async function exportTableData(option) {
  let { data, column, sheetName = 'sheet', filename = '表格' } = option || {}
  if (data instanceof Promise) {
    let res = await awaitFormResolve(data)
    data = Array.isArray(res) ? res : Array.isArray(res?.detail) ? res.detail : []
  }
  if (validatenull(data)) return Message.warning('无数据可导出')
  
  // 需要导出的数据
  const exportArr = data.map((item) => {
    return column.reduce((prev, next) => {
      prev[next.prop] = item[next.prop]
      return prev
    }, {})
  })
  
  // 自定义下载的header，注意是数组中的数组哦
  const Header = [map(column, 'label')]
  
  let headerKeys = []
  column.forEach(col => {
    for (const key in col) {
      if (/^label\d+$/.test(key)) {
        headerKeys.push(key)
      }
    }
  })
  headerKeys = uniq(headerKeys).sort((a, b) => a.replace('label', '') - b.replace('label', ''))
  const header = headerKeys.map(key => {
    return column.reduce((prev, next) => {
      prev[next.prop] = next[key]
      return prev
    }, {})
  })
  // console.log(headerKeys, header)
  
  // 将JS数据数组转换为工作表。
  const headerWs = XLSX.utils.aoa_to_sheet(Header)
  const ws = XLSX.utils.sheet_add_json(headerWs, header.concat(exportArr), { skipHeader: true, origin: 'A2' })
  
  /* 新建空的工作表 */
  const wb = XLSX.utils.book_new()
  
  // 可以自定义下载之后的sheetname
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  
  /* 生成xlsx文件 */
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportWrap(promise, fileName) {
  promise = typeof promise === 'function' ? promise() : promise
  
  let res = await awaitFormResolve(promise)
  if (!res) {
    Message.warning('导出失败')
    return
  } else if ($SUC(res) && typeof res.detail === 'string') {
    res = await downloadFile(res.detail)
    if (res === true) {
      Message.success('导出成功')
      return true
    }
    return
  }
  saveAs(res, fileName)
  Message.success('导出成功')
  return true
}