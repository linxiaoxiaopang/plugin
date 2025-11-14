/* eslint-disable */
import { cloneDeep, camelCase, lowerFirst, set } from 'lodash'

export function getSplitAttrs(attrs, prefixList) {
  const defaultPrefix = prefixList.default
  prefixList = cloneDeep(prefixList)
  delete prefixList.default
  const tmpObj = Object.values(prefixList).reduce((cur, prev) => {
    cur[prev] = {}
    return cur
  }, {})
  const prefixKeys = Object.keys(prefixList)
  Object.keys(attrs).map(key => {
    const camelCaseKey = camelCase(key)
    let fItem = prefixKeys.find(prefix => camelCaseKey.indexOf(prefix) === 0)
    if (!fItem) {
      if (!defaultPrefix) return
      fItem = defaultPrefix
    }
    const pureKey = lowerFirst(camelCaseKey.replace(fItem, ''))
    const prop = `${prefixList[fItem]}.${pureKey}`
    set(tmpObj, prop, attrs[key])
  })
  return tmpObj
}