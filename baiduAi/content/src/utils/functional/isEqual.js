/* eslint-disable */
import { difference, isEqual, uniqWith } from 'lodash'
import { getObjType } from '@/components/avue/utils/util'

export function isEqualComplex(value, other) {
  if (value === other || isEqual(value, other)) return true
  
  const valueType = getObjType(value)
  const otherType = getObjType(other)
  if (valueType !== otherType) return false
  if ([
    'boolean',
    'number',
    'string',
    'function',
    'date',
    'regExp',
    'undefined',
    'null',
    'promise'
  ].includes(valueType)) return isEqual(value, other)
  
  switch (valueType) {
    case 'object':
      const valueKeys = Object.keys(value)
      const otherKeys = Object.keys(other)
      if (!isEqualArray(valueKeys, otherKeys)) return false
      for (const key of valueKeys) {
        if (!isEqualComplex(value[key], other[key])) return false
      }
      break
    case 'array':
      if (!isEqualArray(value, other)) return false
      break
  }
  return true
}

export function isEqualArray(value, other) {
  if (value === other) return true
  if (value.length !== other.length) return false
  const uniqValues = uniqWith([...value, ...other], isEqualComplex)
  return uniqValues.length === value.length
}

export function isEqualDifference(...values) {
  for (let i = 0, len = values.length; i < len; i++) {
    const checkValue = values[i]
    const excludeValues = [...values]
    excludeValues.splice(i, 1)
    if (difference(checkValue, ...excludeValues).length) return false
  }
  return true
}