/* eslint-disable */
import { get } from 'lodash'
import castPath from 'lodash/_castPath'
import { validatenull } from '@/components/avue/utils/validate'

export function getValid(object, path, defaultValue) {
  if (validatenull(path)) return defaultValue
  path = castPath(path, object)
  return get(object, path, getValid(object, path.slice(0,-1)))
}