/* eslint-disable */

export async function importCheckValidator(rule, value, callback, row) {
  await this.importCheckLoading
  const error = row.errorInfo?.[rule.field]
  callback(error)
}

export function setError(row, errorInfo, propOption) {
  if (!row.errorInfo) row.errorInfo = {}
  for (const key in errorInfo) {
    const prop = propOption[key]
    row.errorInfo[prop] = errorInfo[key]
  }
}