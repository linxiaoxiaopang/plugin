/* eslint-disable */
import { isEmpty } from '@/utils/validate'

const regs = {
  twoFixed: {
    errMsg: '请输入至多两位小数的数字',
    reg: /^(-?)(?:[1-9]\d*|0)(?:\.\d{1,2})?$/
  },
  threeFixed: {
    reg: /^(-?)(?:[1-9]\d*|0)(?:\.\d{1,3})?$/,
    errMsg: '请输入至多三位小数的数字'
  },
  notNegative: {
    reg: /^(?:0|[1-9]\d*)(?:\.\d+)?$/,
    errMsg: '请输入非负数'
  }
}
export function validatorFactory({ reg, errMsg, modifiers, formats, format, prefix }) {
  if (!(reg instanceof RegExp)) {
    reg = new RegExp(reg, modifiers)
  }
  if (formats) {
    const formatList = formats.map((key) => regs[key]).filter(Boolean)
    const format = formatList.map((item) => item.reg).join('|')
    reg = new RegExp(`^(${format})*$`, modifiers)
    errMsg = errMsg || `${prefix || ''}格式应为${formatList.map((item) => item.label).join('、')}`
  }
  if (format) {
    format = regs[format]
    reg = format.reg
    errMsg = errMsg || format.errMsg
  }
  return function (rule, value, callback) {
    if (isEmpty(value)) {
      return callback()
    }
    reg.lastIndex = 0
    const rsCheck = reg.test(value)
    if (!rsCheck) {
      callback(errMsg)
    } else {
      callback()
    }
  }
}