export const xlsxBtnDefaultOption = {
  btnText: '导入',
  btnClass: '',
  size: 'small',
  type: 'primary',
  
  isMerge: true
}

export const dialogDefaultOption = {
  title: '导入确认',
  hasBtn: false,
  width: 800
}

export const baseTableDefaultOption = {
  checkAll: false
}

export function defaultHandleImportData (data) {
  if(!this.checkAll) return data
  data.data.forEach((item, index) => {
    item.id = index + 1
    return item
  })
  return data
}


