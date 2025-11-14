import { Message } from 'element-ui'
import { validData } from '@/components/avue/utils/util'
import { isPlainObject, isArray, isBoolean, isString, isNumber, isFunction, isUndefined, map } from 'lodash'

const CommonUtils = class CommonUtils {
  /**
   * 根据character 替换文本
   * @param msg
   * @param character
   * @param replaceStr
   * @returns {string|*}
   */
  static replaceCharacter(msg, replaceStr, character = '*') {
    if (!replaceStr) return msg
    if (!msg) return ''
    if (isArray(replaceStr)) replaceStr = replaceStr.join('、')
    return msg.replace(character, replaceStr)
  }

  static formatRes(res, type = 'array') {
    if (type === 'bool') {
      if (this.isErrFirstRes(res)) return !res[0]
      return res
    }
    if (this.isErrFirstRes(res)) return res
    if (isBoolean(res)) return [!res, null]
    return [!res, res]
  }

  static isErrFirstRes(res) {
    if (!isArray(res)) return false
    if (res.length !== 2) return false
    if (!isBoolean(res[0])) return false
    return true
  }
}


class CheckErrList extends CommonUtils {
  constructor() {
    super()
  }

  static promiseHandler(list, option) {
    return Promise.all(list).then(async res => {
      const data = await Promise.all(map(res, 'result'))
      res.map((item, index) => {
        item.result = data[index]
      })
      return CheckErrList.dealResult(res, option)
    })
  }

  static dealResult(resList, { showErrCount, isMsg, errMsg }) {
    const errList = resList.reduce((arr, res) => {
      const { result, errMsg } = res
      const [err, msg] = super.formatRes(result)
      if (err) arr.push(validData(errMsg, msg))
      return arr
    }, [])
    if (!errList.length) return [false, errList]
    const len = showErrCount === 'all' ? errList.length : showErrCount
    const sliceErrList = errList.slice(0, len)
    if (isMsg) {
      const defaultMsg = `${sliceErrList.join('、')}`
      const msg = validData(super.replaceCharacter(errMsg, sliceErrList), defaultMsg)
      Message.error(msg)
    }
    return [true, sliceErrList]
  }

  static getFnData(validItem) {
    const {
      fnc,
      data
    } = validItem
    validItem.result = fnc
    if (isFunction(fnc)) validItem.result = fnc.apply(null, data)
    return validItem
  }

  static normalizeOption(option) {
    const _default = {
      showErrCount: 1,
      isMsg: true,
      character: '*'
    }
    if (isString(option)) option = { errMsg: option }
    return Object.assign({}, _default, option)
  }

  static normalizeParams(params, data) {
    const _default = {
      errMsg: ''
    }
    if (!isPlainObject(params)) params.fnc = params
    return Object.assign(_default, { data }, params)
  }

  actionHandler(validDataList, data = null, errMsg = undefined) {
    if (!validDataList) return [true, null]
    if (!isArray(validDataList)) validDataList = [validDataList]
    const option = CheckErrList.normalizeOption(errMsg)
    const list = validDataList.map(params => {
      const validItem = CheckErrList.normalizeParams(params, data)
      return CheckErrList.getFnData(validItem)
    })
    const existPromise = list.some(item => item.result instanceof Promise)
    if (existPromise) {
      return CheckErrList.promiseHandler(list, option)
    }
    return CheckErrList.dealResult(list, option)
  }
}

const checkErrList = new CheckErrList()

const MsgClass = class MsgClass extends CommonUtils {
  constructor() {
    super()
  }

  /**
   * 校验选择的数据
   * @param selectedData
   * @param count
   * @returns {boolean}
   */
  checkSelectedDataByNum(selectedData = [], count = 1, option = {}) {
    if (isString(option)) option = { msg: option }
    if (isUndefined(option.isMsg)) option.isMsg = true
    if (!option.resFormat) option.resFormat = 'bool' // bool | Array [err, data]
    if (selectedData.length < count) {
      const errMsg = validData(option.msg, `请至少选择${count}条数据，再进行此操作！`)
      const res = CommonUtils.formatRes(false, option.resFormat)
      if (option.isMsg) Message.warning(errMsg)
      if (option.resFormat === 'array') {
        const [err, data] = res
        if (err && !data) res[1] = errMsg
      }
      return res
    }
    return CommonUtils.formatRes(true, option.resFormat)
  }

  stepCheckErrList(validFuncList, data, errMsg = undefined) {
    if (!isArray(validFuncList)) validFuncList = [validFuncList]
    for (let i = 0; i < validFuncList.length; i++) {
      const item = validFuncList[i]
      const res = this.checkErrList(item, data, errMsg)
      if (res[0]) return res
    }
  }

  /**
   * 校验错误列表
   * @param validFuncList
   * @param data
   * @param errMsg
   * @returns {(boolean|*)[]}
   */
  checkErrList(validFuncList, data = null, errMsg = undefined) {
    return checkErrList.actionHandler(validFuncList, data, errMsg)
  }
}


export const msgClass = new MsgClass()

/**
 * 格式化报错信息
 * @param msg
 * @param option
 * @returns {*}
 */
export function replaceErrorMsg(msg, option) {
  if (isString(option) || isNumber(option)) option = { $1: option }
  if (isArray(option)) {
    option = option.reduce((cur, prev, index) => {
      cur[`$${index + 1}`] = prev
      return cur
    }, {})
  }
  if(!isPlainObject(option)) return msg
  Object.entries(option).map(([prop,val]) => {
    msg = msg.replace(prop, val)
  })
  return msg
}

