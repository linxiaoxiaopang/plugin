/* eslint-disable */
import Vue from 'vue'
import Schema from 'async-validator'
import { isArray, get } from 'lodash'

/**
 * 根据column校验数据
 * @param column
 * @param data
 * @param option
 * @returns {unknown[]|Promise<Awaited<unknown>[]>}
 */
export function fillValidErrorPassColumnInData(column, data, option = {}) {
  let { callback, isAsync, clearErrorBeforeValid = true, ...restOption } = option
  if (!isArray(data)) data = [data]
  if (clearErrorBeforeValid) {
    data.map(item => {
      Vue.delete(item, 'asyncValidatorErrorList')
    })
  }
  const descriptor = createDescriptorByColumn(column)
  const validator = new Schema(descriptor)
  const cn = {
    required: '$label必填'
  }
  validator.messages(cn)
  callback = callback || function (
    {
      errors,
      fields,
      row
    }
  ) {
    if (!errors) return
    errors.map(item => {
      let { field, message } = item
      const errProp = `_${field}_errMsg`
      const fItem = column.find(item => item.prop == field)
      const label = $GET(fItem, 'label', '')
      if (label && message.indexOf('$label') >= 0) {
        message = message.replace('$label', fItem.label).replace(field, '')
      }
      if (!row.asyncValidatorErrorList) {
        Vue.set(row, 'asyncValidatorErrorList', {})
      }
      Vue.set(row.asyncValidatorErrorList, errProp, message)
    })
  }
  delete option.callback
  const result = []
  const pArr = []
  data.map((item, index) => {
    const resItem = result[index] = {
      errors: [],
      fields: [],
      row: item
    }
    const p = validator.validate(item, restOption, (errors, fields) => {
      callback({
        errors,
        fields,
        row: item
      })
      resItem.errors = errors
      resItem.fields = fields
    })
    pArr.push(p)
  })
  
  if (isAsync) {
    return Promise.all(result).then(() => {
      return result
    })
  }
  return result
}

/**
 * 格式化描述符，用于async-validator
 * @param column
 * @returns {*}
 */
export function createDescriptorByColumn(column) {
  return column.reduce((cur, prev) => {
    const { prop } = prev
    const rules = prev.rules || []
    cur[prop] = rules
    return cur
  }, {})
}


export function validateField(form, field) {
  return !getErrMsg(form, field)
}
export function getErrMsg(form, field) {
  return get(form, `asyncValidatorErrorList._${field}_errMsg`)
}