import castPath from 'lodash/_castPath'

export function getFormDataByOption(data, column) {
  column = getDisplayColumn(Array.isArray(column) ? column : column.column)
  let form = {}
  column.forEach(({ prop }) => {
    prop = castPath(prop)[0]
    form[prop] = data[prop]
  })
  return form
}

export function getDisplayColumn(column) {
  return (Array.isArray(column) ? column : []).filter(col => !col.hide)
}