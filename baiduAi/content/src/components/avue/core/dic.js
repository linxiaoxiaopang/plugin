/* eslint-disable */
import { find } from 'lodash'
import { setDic } from '@/components/avue/utils/util'

export async function getDic(params) {
  let { value, api, column, cascaderColumn, DIC } = params
  if (column) {
    api = column.dicApi || (() => find(setDic(cascaderColumn, DIC), { value })?.children)
  }
  return typeof api === 'function' && await api(params) || []
}

export function getDicName(column) {
  return column.dicType || column.prop
}