export function dialogOpen(getSelectionData, sup_this) {
  if (!this.init && sup_this) this.init = sup_this.init
  this.getSelectionData = getSelectionData
  this.dialogVisible = true
}

export async function handleSelectionData(that, param, callback) {
  param = validateSelectionData(that, param)
  if (!param) return
  typeof callback === 'function' && await callback(param, that)
  return param
}
export function validateSelectionData(that, param) {
  if (param === 'batch') {
    if (!that.selectionDataAllArr.length) {
      that.$message.warning('请至少选择一条数据')
      return false
    }
    param = that.getSelectionDataAllArr
  }
  return getSelectionData(param)
}
export function getSelectionData(selectionData) {
  if (typeof selectionData === 'function') return selectionData
  selectionData = Array.isArray(selectionData) ? selectionData : [selectionData]
  return () => selectionData
}