/**
 * Created by jiachenpan on 16/11/18.
 */
import { validatenull } from '@/components/avue/utils/validate'
import { getObjType } from '@/components/avue/utils/util'

export function handleFormRules(rules, form, callback) {
  for (const key in rules) {
    let errMsg = handleRules(rules[key], form[key], form)
    callback(errMsg, key, form[key], rules[key])
  }
}

export function handleRules(rules, value, form) {
  rules = Array.isArray(rules) ? rules : [rules]
  let aRules = Array.isArray(rules) ? rules : [rules]
  let defaultMsg = '请正确输入数据'
  let errMsg
  aRules.find(({ required, validator, validateForm, message }) => {
    if (!validatenull(value)) {
      if (typeof validator === 'function') {
        validator(rules, value, (err) => {
          errMsg = err && (message || (typeof err === 'string' ? err : err.message))
        })
        if (errMsg) {
          return true
        }
      }
    } else if (required) {
      errMsg = message || defaultMsg
      return true
    }

    if (typeof validateForm === 'function') {
      validateForm(rules, form, (err) => {
        errMsg = err && (message || (getObjType(err) === 'object' ? err.message : err))
      })
      if (errMsg) {
        return true
      }
    }
  })
  return errMsg
}

export function isEmpty(value) {
  return value === undefined || value === '' || value === null
}

export function validatorFactory({ reg, errMsg, modifiers }) {
  if (!(reg instanceof RegExp)) {
    reg = new RegExp(reg, modifiers)
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
export const validatorOptions = {
  number: {
    reg: /^[0-9]*$/,
    errMsg: '请输入数字'
  },
  intNumber: {
    reg: /^[1-9]\d*$/,
    errMsg: '请输入正整数'
  },
  initNumberAndZero: {
    reg: /^([1-9]\d*|[0]{1,1})$/,
    errMsg: '请输入0或者正整数'
  },
  // 正浮点数
  intFloat: {
    reg: /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$/,
    errMsg: '请输入数字'
  },
  // 非负浮点数（正浮点数 + 0）
  notNFloating: {
    reg: /^(?:[1-9]\d*(?:\.\d+)?)|(?:0\.\d+)|(?:0)$/,
    errMsg: '请输入非负浮点数'
  },
  money: {
    reg: /(?:^[1-9]([0-9]+)?(?:\.[0-9]{1,2})?$)|(?:^(?:0){1}$)|(?:^[0-9]\.[0-9](?:[0-9])?$)/,
    errMsg: '金额格式错误'
  },

  chinese: {
    reg: /[\u4e00-\u9fa5]/,
    errMsg: '请输入汉字'
  },
  notChinese: {
    reg: /^[^\u4e00-\u9fa5]*$/,
    errMsg: '不支持汉字输入'
  }
}
export const validators = {}
for (const type in validatorOptions) {
  validators[type] = validatorFactory(validatorOptions[type])
}

export function validateSpecialCharacter(rule, value, callback) {
  if (value.indexOf('管理员') != -1 || value.toLowerCase().indexOf('admin') != -1) {
    callback('不能包含admin或管理员')
  }
  callback()
}

/* 合法uri*/
export function validateURL(textval) {
  const urlregex =
    /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/
  return urlregex.test(textval)
}

/* 小写字母*/
export function validateLowerCase(str) {
  const reg = /^[a-z]+$/
  return reg.test(str)
}

/* 大写字母*/
export function validateUpperCase(str) {
  const reg = /^[A-Z]+$/
  return reg.test(str)
}

/**
 * 验证邮箱
 * @param str
 * @returns {boolean}
 */
export function validatEmail(str) {
  const reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/
  return reg.test(str)
}

// 手机号验证
export function isvalidPhone(str) {
  const reg = /^1[3|4|5|7|8][0-9]\d{8}$/
  return reg.test(str)
}

// 不能输入中文
export function isvalidChinaese(str) {
  const reg = /^[a-zA-Z0-9_]+$/g
  return reg.test(str)
}

//输入中英文下划线和数字
export function isReasonableText(str) {
  // return /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(str)
  return /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(str)
}

//只适用element-ui库 的校验方法

/* 邮件*/
export function isEmail(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('请输入正确的Email')
  } else {
    callback()
  }
}

// 手机号验证
export function isTele(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('请输入正确的手机号')
  } else {
    callback()
  }
}

// 联系方式验证
export function isContactPhone(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^(\d{3,4}|\d{3,4}-|\s)+$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('请输入正确的手机号')
  } else {
    callback()
  }
}

// 至少8-16个字符，至少1个大写字母，1个小写字母和1个数字，其他可以是任意字符
export function isRobust(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,16}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('8-16个字符，1个大写字母，1个小写字母和1个数字')
  } else {
    callback()
  }
}

// 字符长度限制 validator构造函数
export function charLenLimitConstructor(min, max, err) {
  const reg = new RegExp(`^[.\\s\\S]{${min},${max}}$`)
  err = err || `请输入${min}-${max}个字符`
  return function (rule, value, callback) {
    if (isEmpty(value)) {
      return callback()
    }
    value = value.replace(/\n/g, '') //多行文本，转换成单行文本
    reg.lastIndex = 0
    const rsCheck = reg.test(value)
    if (!rsCheck) {
      callback(err)
    } else {
      callback()
    }
  }
}
export function charLenMaxConstructor(max, prefix = '') {
  return charLenLimitConstructor(0, max, `${prefix}至多输入${max}个字符`)
}
//至少2-6个字符
export function is2And6char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{2,6}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少2-6个字符')
  } else {
    callback()
  }
}
//至少2-10个字符
export function is2And10char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{2,10}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少2-10个字符')
  } else {
    callback()
  }
}
//至少8-50个字符
export function is8And50char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{8,50}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少8-50个字符')
  } else {
    callback()
  }
}

//至少4-20个字符
export function is4And20char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{4,20}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少4-20个字符')
  } else {
    callback()
  }
}

//至少2-30个字符
export function is2And30char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{2,30}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少2-30个字符')
  } else {
    callback()
  }
}

//至少1-64个字符
export function is1And64char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{1,64}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少1-64个字符')
  } else {
    callback()
  }
}

//至少1-255个字符
export function is1And255char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{1,255}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少1-255个字符')
  } else {
    callback()
  }
}

//至少1-50个字符
export function is1And50char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{1,50}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少1-50个字符')
  } else {
    callback()
  }
}

//至少1-30个字符
export function is1And30char(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^.{1,30}$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('至少1-30个字符')
  } else {
    callback()
  }
}

/* 大小写字母数字、_*/
export function isW(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^\w+$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('请输入大小写字母、数字、_')
  } else {
    callback()
  }
}

// 最大值限制构造函数
export function numMaxConstruct(max, err) {
  max = Number(max)
  err = err || `最大值为${max}`
  return function (rule, value, callback) {
    if (isEmpty(value)) {
      return callback()
    }
    if (Number(value) > max) {
      callback(err)
    } else {
      callback()
    }
  }
}

/* 大小写字母*/
export function validatAlphabets(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const reg = /^[A-Z\sa-z\d-_]+$/
  const rsCheck = reg.test(value)
  if (!rsCheck) {
    callback('请输入大小写字母')
  } else {
    callback()
  }
}

export function isInt(value) {
  return /^[1-9][0-9]*$/.test(value)
}

export function isInteger(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const re = /^[1-9][0-9]*$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('请输入正整数'))
  } else {
    callback()
  }
}

// 验证是否是整数
export function isIntegerAndZero(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback(new Error('输入不可以为空'))
  }
  const re = /^[0-9]*$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('请输入大于等于0的整数'))
  } else {
    callback()
  }
}

// 验证是否是金额_
export function isPrice(value) {
  return /(?:^[1-9]([0-9]+)?(?:\.[0-9]{1,2})?$)|(?:^(?:0){1}$)|(?:^[0-9]\.[0-9](?:[0-9])?$)/.test(value)
}

// 验证是否是金额_
export function isMoney(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const re = /(?:^[1-9]([0-9]+)?(?:\.[0-9]{1,2})?$)|(?:^(?:0){1}$)|(?:^[0-9]\.[0-9](?:[0-9])?$)/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('金额格式错误'))
  } else {
    callback()
  }
}

// 验证是否为非负数
export function validateNotNegative(value) {
  return /(?:^[1-9]([0-9]+)?(?:\.[0-9]{1,2})?$)|(?:^(?:0){1}$)|(?:^[0-9]\.[0-9](?:[0-9])?$)/.test(value + '')
}
export function notNegative(rule, value, callback) {
  if (isEmpty(value)) {
    return callback()
  }
  const re = /(?:^[1-9]([0-9]+)?(?:\.[0-9]{1,2})?$)|(?:^(?:0){1}$)|(?:^[0-9]\.[0-9](?:[0-9])?$)/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('请输入非负数'))
  } else {
    callback()
  }
}

// 验证是否非中文
export function isNotChinese(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /[\u4e00-\u9fa5]/
  const rsCheck = re.test(value)
  if (rsCheck) {
    callback(new Error('不支持汉字输入'))
  } else {
    callback()
  }
}
// 验证只能是中文英文和逗号
export function isCity(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^[A-Za-z\u4e00-\u9fa5, ，]+$/
  const rsCheck = re.test(value)

  if (rsCheck) {
    callback()
  } else {
    callback(new Error('只能输入汉字英文和逗号'))
  }
}
// 验证邮编
export function isPostal(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^[0-9]{6}$/
  const rsCheck = re.test(value)
  if (rsCheck) {
    callback()
  } else {
    callback(new Error('邮编格式错误'))
  }
}
// 验证是否数字字母_
export function isCommonCharacters(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^\w+$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('只能输入数字字母下划线'))
  } else {
    callback()
  }
}
// 验证是否数字字母_-
export function isWord(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^[\w-]+$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('只能输入数字字母下划线'))
  } else {
    callback()
  }
}

// 验证是否数字字母
export function isNumberAndLetter(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^[a-zA-Z\d]+$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('只能输入数字字母'))
  } else {
    callback()
  }
}

// 验证是否数字字母_和点字符
export function isCommonCharactersAndPoint(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^[\w-.+]+$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('只能输入数字字母，下划线，加号。'))
  } else {
    callback()
  }
}

export function validateMulPropOfRequiredFactory(that, props, formKey = 'form') {
  let keys = []
  let labels = []
  props.map((item) => {
    keys.push(item.prop)
    labels.push(item.label)
  })
  let errMsg = `${labels.slice(0, -1).join('、')}和${labels.pop()}其中一个必须有值`
  return (rule, value, callback) => {
    let form = that[formKey]
    if (keys.every((key) => validatenull(form[key]))) {
      return callback(errMsg)
    }
    that[`${formKey}Methods`]('clearValidate', keys)
    callback()
  }
}

// 验证银行卡密码
export function validateBlankPassword(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^\d{6}$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('只能输入6位数字'))
  } else {
    callback()
  }
}

// 验证身份证号
export function validateIdNumber(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re =
    /^\d{6}((((((19|20)\d{2})(0[13-9]|1[012])(0[1-9]|[12]\d|30))|(((19|20)\d{2})(0[13578]|1[02])31)|((19|20)\d{2})02(0[1-9]|1\d|2[0-8])|((((19|20)([13579][26]|[2468][048]|0[48]))|(2000))0229))\d{3})|((((\d{2})(0[13-9]|1[012])(0[1-9]|[12]\d|30))|((\d{2})(0[13578]|1[02])31)|((\d{2})02(0[1-9]|1\d|2[0-8]))|(([13579][26]|[2468][048]|0[048])0229))\d{2}))(\d|X|x)$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('请输入正确的身份证号'))
  } else {
    callback()
  }
}

/**
 * @description: 校验登录拖拽
 * @param {*}
 * @return {*}
 */
export function validateDragVerify(rule, value, callback) {
  console.log('valuevalue', value)
  if (!value) {
    return callback(new Error('请滑动验证'))
  }
  callback()
}

// 验证不能全部为数字
export function validateNotAllIsNumber(rule, value, callback) {
  console.log('value', value)
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^\d+$/g
  const rsCheck = re.test(value)
  console.log('rsCheck', rsCheck)
  if (rsCheck) {
    callback(new Error('不能全部为数字'))
  } else {
    callback()
  }
}

//输入中英文下划线和数字
export function validateReasonableText(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  const re = /^[\u4e00-\u9fa5_a-zA-Z0-9.]+$/
  const rsCheck = re.test(value)
  if (!rsCheck) {
    callback(new Error('只能输入中英文下划线、数字和英文句点'))
  } else {
    callback()
  }
}
export function characterSmall32(rule, value, callback) {
  if (value === undefined || value === '') {
    return callback()
  }
  if (value?.length > 30) {
    callback(new Error('默认值需少于30个字符'))
  } else {
    callback()
  }
}

// 生成输入值大小值校验器
export function createLimitNumberLengthValidator({ min, isEqualToMin = true, max, isEqualToMax = true }, label = '输入值') {
  let validate
  const hasMin = min !== undefined
  const hasMax = max !== undefined
  if (!hasMax && !hasMax) {
    throw '至少设置一个限制'
  } else if (hasMin && hasMax) {
    const err = `${ label }输入范围为${min}-${max}`
    validate = (rule, value) => {
      value = Number(value)
      if (value < min || value > max) {
        return err
      }
    }
  } else if (hasMin) {
    const err = isEqualToMin ? `${label}应大于或等于${min}` : `${label}应大于${min}`
    const isErr = isEqualToMin ? (value) => Number(value) < min : (value) => Number(value) <= min
    validate = (rule, value) => {
      if (isErr(value)) {
        return err
      }
    }
  } else if (hasMax) {
    const err = isEqualToMax ? `${label}应小于或等于${max}` : `${label}应小于${max}`
    const isErr = isEqualToMax ? (value) => Number(value) > max : (value) => Number(value) >= max
    validate = (rule, value) => {
      if (isErr(value)) {
        return err
      }
    }
  }
  return (rule, value, callback) => {
    if (isEmpty(value)) {
      return callback()
    }
    callback(validate(rule, value))
  }
}
