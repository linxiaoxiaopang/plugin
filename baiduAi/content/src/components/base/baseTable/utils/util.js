/* eslint-disable */
import { compose, validatenull } from '@/components/avue/utils/validate'
import { validData } from '@/components/avue/utils/util'
import { accAdd } from '@/utils'
import { getTabsOption } from '@/components/base/baseTabs/util'
import { curryRight, uniq, concat, pull } from 'lodash'

/**
* @description: 获取表格列数
* @param: option {Object}
* @return: length {Number}
*/
export function getColumnLenByOption(option) {
  if (validatenull(option)) return 0
  let len = 0
  option.menu !== false && len++ // menu默认为true
  option.expand && len++
  option.selection && len++
  option.index && len++
  
  len += getColumnVisibleList(option.column).length
  return len
}

export function getColumnVisibleList(column) {
  if (validatenull(column)) return []
  return column.filter((column) => !column.hide)
}

export function handleSearchOption(option, isCrud = true) {
  let defaultWidths = {
    selectInput: 368,
    daterange: 256,
    input: 256,
    select: 256
  }
  
  let labelWidthKey = isCrud ? 'searchLabelWidth' : 'labelWidth'
  let widthKey = isCrud ? 'searchWidth' : 'width'
  
  let { [labelWidthKey]: labelWidth } = option
  option.column.forEach((column) => {
    if (isCrud && !column.search) return
    
    let type = validData(column.type, column.searchType, 'input')
    
    if (validatenull(column[labelWidthKey])) {
      // label 不存在表示该项不是单行
      column[labelWidthKey] = column.label ? labelWidth : 20
    }
    
    if (validatenull(column[widthKey]) && validatenull(column.span)) {
      let defaultWidth = defaultWidths[type]
      defaultWidth && (column[widthKey] = accAdd(defaultWidth, column[labelWidthKey]))
    }
    
    if (type === 'input') {
      column.prefixIcon = validData(column.prefixIcon, 'el-icon-search')
    }
  })
}


/**
* @description: 将搜索表单(searchColumn)、表格列(column)和option配置项分离开来
* @param:
* @return:
*/
export function assembleOptions({ searchColumns, columns, options }) {
  let keys = compose(uniq, concat)(
    Object.keys(searchColumns),
    Object.keys(columns),
    Object.keys(options)
  )
  
  const result = {}
  keys.forEach((key) => {
    const option = options[key] || options.default
    const searchCol = searchColumns[key] || searchColumns.default
    const column = columns[key] || columns.default
    result[key] = {
      ...option,
      column: [
        ...searchCol,
        ...column
      ]
    }
  })
  return result
}
export function getOption(options, key) {
  const option = options[key]
  if (option) {
    return options.merge
      ? {
        ...options.merge,
        ...option
      }
      : option
  }
  return options.default
}

const sign = '$setProto'
export function setProto(target, source, props = Object.keys(source)) {
  let newProto
  if (target.__proto__.hasOwnProperty(sign)) {
    newProto = target.__proto__
  } else {
    newProto = target.__proto__.hasOwnProperty(sign) ? target.__proto__ : { [sign]: true }
    newProto.__proto__ = target.__proto__
    target.__proto__ = newProto
  }
  
  props.forEach((prop) => newProto[prop] = source[prop])
}