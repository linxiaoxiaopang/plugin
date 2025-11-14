/* eslint-disable */
import { find } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export function findTabByValue(dic, value) {
  dic = getTabsOption(dic).column
  let item = find(dic, { value })
  if (item) return item
  
  dic.find(dicItem => {
    return item = dicItem.children && findTabByValue(dicItem.children, value)
  })
  return item
}
export function getTabsOption(dic) {
  return Array.isArray(dic) ? { column: dic } : dic
}
export function getTabValues(list) {
  if (validatenull(list)) return {}
  let tempObj = {}
  let option = getTabsOption(list)
  option.column?.forEach(item => {
    if (item.options) {
      return Object.assign(tempObj, getTabValues(item.options))
    }
    
    tempObj[item.value] = item
    item.children && Object.assign(tempObj, getTabValues(item.children))
    
    if (item.type) {
      Object.assign(tempObj, getTabValues(item.dicData))
    }
  })
  return tempObj
}
export function getTabAllLevels(list, parentLevels = []) {
  if (validatenull(list)) return {}
  
  let tempObj = {}
  let option = getTabsOption(list)
  option.column.forEach(item => {
    tempObj[item.value] = parentLevels.concat(item.value)
    item.children && Object.assign(tempObj, getTabAllLevels(item.children, tempObj[item.value]))
  })
  return tempObj
}

export function findByValue(dic, value) {
  let item = find(dic, { value })
  if (item) return item
  
  dic.find(dicItem => {
    return item = dicItem.children && findByValue(dicItem.children, value)
  })
  return item || value
}

export function filterByPermission(dic) {
  if (validatenull(dic)) return []
  
  if (Array.isArray(dic)) {
    return dic.filter((item) => {
      if (item.permission && item.children) {
        item.children = filterByPermission(item.children)
        return getTabsOption(item.children).column?.length
      }
      return item.permission !== false
    })
  } else {
    dic.column = filterByPermission(dic.column)
  }
  return dic
}