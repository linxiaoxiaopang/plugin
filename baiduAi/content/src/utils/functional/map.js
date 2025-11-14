/* eslint-disable */
import { flatMap, filter, isArray, isString } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'
import { stringToPath } from '@/utils/functional/stringToPath'

export function flatMapDeepBy(collection, iteratee) {
  if (validatenull(iteratee)) return filter(collection, item => ![undefined, null].includes(item))
  if (isString(iteratee)) {
    iteratee = stringToPath(iteratee)
  }
  if (isArray(iteratee)) {
    collection = [].concat(collection)
    collection = flatMap(collection, iteratee.shift())
    return flatMapDeepBy(collection, iteratee)
  }
  return flatMap(collection, iteratee)
}