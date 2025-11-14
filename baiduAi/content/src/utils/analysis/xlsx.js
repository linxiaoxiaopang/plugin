/* eslint-disable */
import { cloneDeep, uniq, set, isString, isArray, isPlainObject, isFunction, merge } from 'lodash'
import { compose } from '@/components/avue/utils/validate'
import { FormatObject } from '@/utils/format/object'
import { getResult } from '@/utils/functional'

export function normalizeData(data, keyMap, reverse) {
  data = cloneDeep(data)
  let { columnMap = {}, columnHandler, columnMergeData, isTrueKey = true, isUniqKey, isFuzzyKey } = keyMap
  keyMap = normalizeMap(keyMap, reverse, isFuzzyKey)
  return compose(handler, normalize)(data)
  
  function normalize(data, depth = 0) {
    const nextDepth = depth + 1
    if (data[0].children) {
      data = uniq(data)
    }
    return data
      .map((item, index) => {
        // !item.children 表格无内容时会把最后一行表头过滤掉
        if (!item.isHeader) return item
        
        if (item.v) {
          handleColumn(item, { column: item, rowIndex: depth })
        } else {
          item.prop = item.selfProp = index + ''
        }
        if (!isUniqKey && item.parent) item.prop = `${ item.parent.prop }_${ item.prop }`
        
        if (item.children) item.children = normalize(item.children, nextDepth)
        
        return item
      })
  }
  function handler(data) {
    return columnHandler || columnMergeData ? realHandler(data) : data
    
    function realHandler(data, depth = 0) {
      const nextDepth = depth + 1
      return data
        .map(item => {
          // !item.children 表格无内容时会把最后一行表头过滤掉
          if (!item.isHeader) return item
          
          if (columnHandler) {
            const valid = columnHandler({ column: item, rowIndex: depth })
            if (valid === false) return
          }
          if (columnMergeData) {
            merge(item, columnMergeData)
          }
  
  
          if (item.children) item.children = realHandler(item.children, nextDepth)
          
          return item
        })
        .filter(Boolean)
    }
  }
  
  function handleColumn(item, args) {
    item.label = item.v
    
    const [propOrFn, , columnHandler] = findMap(item.v, args) || []
    
    let prop = getResult(propOrFn, args)
    // 找不到prop时，填充单元格数据
    if (!isTrueKey) prop = prop ?? item.v
    item.prop = item.selfProp = prop
    
    getColumn(columnHandler, args)
    const handler = columnMap[item.prop]
    if (handler) getColumn(handler, args)
    
    
    function getColumn(handler, args) {
      if (isPlainObject(handler)) Object.assign(item, handler)
      if (isFunction(handler)) handler(item, args)
    }
  }
  function findMap(v, args) {
    return keyMap.find(([, isEqual]) => isEqual(v, args))
  }
}
export function normalizeOptions(data) {
  data = cloneDeep(data)
  const result = normalize(data)
  deleteSomeKey(result.column, ['parent'])
  result.column = filterColumn(result.column)
  return result
  
  function normalize(data, result = { data: [], column: data }) {
    const lastHeader = []
    uniq(data).forEach((item) => {
      if (item.isHeader) {
        if (item.children) normalize(item.children, result)
      } else if (item.parent) {
        item.parent.children.forEach((row, index) => {
          if (!result.data[index]) result.data[index] = {}
          if (row.parent.prop) set(result.data[index], row.parent.path || row.parent.prop, row.v)
        })
        lastHeader.push(item.parent)
      }
      return item
    })
    
    deleteSomeKey(lastHeader, ['children'])
    
    return result
  }
  function filterColumn(column) {
    return column.filter(item => item.prop)
  }
}

export function normalizeMap(keyMap, reverse, isFuzzyKey) {
  const normalizedMap = FormatObject.normalizeMap(keyMap.map, reverse)
  return normalizedMap.map(([key, value, columnHandler]) => {
    if (isString(value)) value = [value]
    if (isArray(value)) {
      const arr = value
      value = isFuzzyKey ? (v) => !!v && arr.some(s => v.includes(s)) : (v) => arr.includes(v)
    }
    return [key, value, columnHandler]
  })
}

export function deleteSomeKey(data, keys) {
  for (const item of data) {
    if (item.children) deleteSomeKey(item.children, keys)
    for (const key of keys) {
      delete item[key]
    }
  }
}