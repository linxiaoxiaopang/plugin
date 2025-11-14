/* eslint-disable */
import { filter, get } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export function filterTableData(tableData, { complete } = {}) {
  if (!validatenull(complete)) {
    const normalizedComplete = {}
    for (const key in complete) {
      if (!validatenull(complete[key])) normalizedComplete[key] = complete[key]
    }
    tableData = filter(tableData, item => Object.entries(normalizedComplete).every(([key, value]) => get(item, key) == value))
  }
  return tableData
}