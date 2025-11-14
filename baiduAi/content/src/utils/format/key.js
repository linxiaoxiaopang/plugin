/* eslint-disable */
import { validatenull } from '@/components/avue/utils/validate'
import { uniq } from 'lodash'

export function transformKey(obj, keyMap, isStrict) {
  const keyMapEntries = normalizeKeyMap(keyMap)
  const tmpObj = {}
  for (const objKey in obj) {
    const key = findKeyByEntry(objKey, keyMapEntries, isStrict)
    if (!key) continue
    tmpObj[key] = obj[objKey]
  }
  return tmpObj
}
export function normalizeKeyMap(keyMap) {
  if (keyMap.$isComplex) {
    const { key = 'key', toKey = 'toKey', map } = keyMap
    const tmpObj = {}
    const oKeyMap = map[key] || {}
    const toKeyMap = map[toKey] || {}
    const keys = uniq(Object.keys(oKeyMap).concat(Object.keys(toKeyMap)))
    for (const key of keys) {
      tmpObj[key] = {
        oKey: oKeyMap[key],
        nKey: toKeyMap[key] || key
      }
    }
    keyMap = Object.values(tmpObj).map(({ nKey, oKey }) => ([nKey, oKey]))
  }
  return Array.isArray(keyMap) ? keyMap : Object.entries(keyMap)
}
export function findKeyByEntry(objKey, keyMapEntries, isStrict, args) {
  const keyEntry = keyMapEntries.find(([, map]) => isEqualKey(objKey, map, isStrict))
  if (!keyEntry) return
  let key = keyEntry[0]
  if (typeof key === 'function') key = key(objKey, keyEntry, args)
  return key
}
export function isEqualKey(nKey, oKey, isStrict) {
  if (validatenull(nKey) || validatenull(oKey)) return false
  if (nKey === oKey) return true
  oKey = Array.isArray(oKey) ? oKey : [oKey]
  const isEqual = isStrict
    ? (a, b) => a === b
    : (a, b) => `${ a }`.includes(b)
  return oKey.some(key => isEqual(nKey, key))
}

export function findKey(objKey, keyMap, isStrict, args) {
  const keyMapEntries = normalizeKeyMap(keyMap)
  return findKeyByEntry(objKey, keyMapEntries, isStrict, args)
}