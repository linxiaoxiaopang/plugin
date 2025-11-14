/* eslint-disable */
import { getResult } from '@/utils/functional'
import { isString } from 'lodash'

export function getOptionBy(options, condition, option) {
  const key = getResult(condition)
  if (isString(option)) option = { defaultKey: option }
  const { defaultKey = 'default' } = option || {}
  return options[key] || options[defaultKey]
}