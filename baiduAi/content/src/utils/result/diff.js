/* eslint-disable */
import { transform, difference, isEqual, isObject, isArray, sortBy } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export function deepDiff(object, base) {
  function changes(object, base) {
    return transform(object, function(result, value, key) {
      if (!isEqual(value, base[key])) {
        result[key] = (isObject(value) && isObject(base[key])) ? changes(value, base[key]) : value
      }
    })
  }
  return changes(object, base)
}

export function diffIdList(newIdList, oldIdList) {
  return {
    add: difference(newIdList, oldIdList),
    del: difference(oldIdList, newIdList)
  }
}

export function delEmpty(object) {
  function changes(object) {
    
    const set = isArray(object)
      ? (result, key, value) => result.push(value)
      : (result, key, value) => result[key] = value
    
    return transform(object, function(result, value, key) {
      value = isObject(value) ? changes(value) : value
      if (!validatenull(value)) {
        set(result, key, value)
      }
    })
  }
  return changes(object)
}
export function judgeEmpty(object) {
  object = delEmpty(object)
  return validatenull(object) ? undefined : object
}


export function isEqualIdList(idList1, idList2) {
  return isEqual(sortBy(idList1), sortBy(idList2))
}