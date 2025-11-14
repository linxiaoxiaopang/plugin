/* eslint-disable */
import { merge, isUndefined } from 'lodash'

const DEFAULT_OPTION = {
  // 函数集合
  fns: [],
  // first（第一个函数参数）、last（上一个函数返回值）
  param: 'first',
  validate: (value) => !isUndefined(value)
}
export default class Pipe {
  constructor(option) {
    this.option = merge({}, DEFAULT_OPTION, option)
  }
  
  result = (...args) => {
    let { param, fns, validate } = this.option
    if (param === 'last') {
      const oValidate = validate
      validate = (result) => {
        args = [result]
        return oValidate(result)
      }
    }
    for (const fn of fns) {
      const result = fn(...args)
      if (validate(result)) return result
    }
  }
  
}