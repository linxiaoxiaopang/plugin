/* eslint-disable */

export function getFormColumn(option) {
  const group = getFormGroup(option)
  let tempArr = []
  group.forEach((item) => {
    tempArr = tempArr.concat(item.column || [])
  })
  return tempArr
}
export function getFormGroup(option) {
  let group = option.group || []
  option.column && group.push({
    ...option,
    group: undefined
  })
  return group
}