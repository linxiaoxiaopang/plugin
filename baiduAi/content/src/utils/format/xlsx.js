/* eslint-disable */
import { findKeyByEntry, normalizeKeyMap } from '@/utils/format/key'
import { validData } from '@/components/avue/utils/util'
import conversion from '@/utils/calculate/conversion'

export function xlsxArrToTableData(header, body, keyMap = {}) {
  const keyMapEntries = normalizeKeyMap(keyMap)
  const result = []
  header.forEach((key, columnIndex) => {
    const formatKey = validData(findKeyByEntry(key, keyMapEntries), key)
    body.forEach((row, rowIndex) => {
      if (!result[rowIndex]) result[rowIndex] = {}
      result[rowIndex][formatKey] = row[columnIndex]
    })
  })
  return result
}

export function xlsxArrToObj(header, body, keyMap = {}) {
  const keyMapEntries = normalizeKeyMap(keyMap)
  const result = {}
  header.forEach((key, columnIndex) => {
    const formatKey = validData(findKeyByEntry(key, keyMapEntries), key)
    result[formatKey] = {}
    body.forEach((row, rowIndex) => {
      result[formatKey][rowIndex] = row[columnIndex]
    })
  })
  return result
}

export function formatRowHeader(header, body, keyMap) {
  const keyMapEntries = normalizeKeyMap(keyMap)
  const result = {}
  body.forEach((row) => {
    let column = {}
    row.forEach((value, index) => {
      const formatKey = validData(findKeyByEntry(value, keyMapEntries), value)
      if (header.includes(formatKey)) {
        column = {
          label: value,
          prop: formatKey,
          type: keyMap.type
        }
      } else {
        const handler = keyMap.valueHandler?.[column.prop] || keyMap.valueHandler?.default
        if (handler) {
          try {
            value = handler(value, column)
          } catch {}
        }
        
        switch (column.type) {
          case 'array':
            if (!result[column.prop]) result[column.prop] = []
            result[column.prop].push(value)
            break
          default:
            result[column.prop] = value
        }
        row[index] = {
          value,
          column
        }
      }
    })
  })
  return result
}