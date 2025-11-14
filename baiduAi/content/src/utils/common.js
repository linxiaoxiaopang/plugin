import { map, flattenDepth, isArray, camelCase, isUndefined, isPlainObject, cloneDeep, lowerFirst, set } from 'lodash'
import { validData } from '@/components/avue/utils/util'
/**
 * 将dataObj的键名替换为keyObj里的对应值
 * @param {Object} dataObj
 * @param {Object} keyObj
 * @param {Boolean} isKeyObj // true为{oldKey: newKey}, false为{newKey: oldKey}
 * @returns {Object}
 * @example see @/views/order/orderImport
 * @description 改变Obj数据的key
 */
export function changeObjKey(dataObj, keyObj, isKeyObj = false) {
  let nObj = {}

  if (isKeyObj){
    Object.keys(dataObj).forEach(key => {
      let nKey = keyObj[key]
      nKey && (nObj[nKey] = dataObj[key])
    })
  } else {
    // 旧键名数组
    let dataKeys = Object.keys(dataObj)
    Object.entries(keyObj).forEach(entry => {
      // keyObj旧键名允许类型是数组
      let oKeys = Array.isArray(entry[1]) ? entry[1] : [entry[1]]
      // 获取旧键名，即dataKeys的某一个子项
      let oKey = dataKeys.find(dataKey => {
        return oKeys.find(oKey => {
          // 表格标题名（即旧键名）允许含有*和空格
          return dataKey.replace(/[* ]/g, '') === oKey
        })
      })

      nObj[entry[0]] = dataObj[oKey] || ''
    })
  }

  return nObj
}
/**
 * 将dataArr的键名替换为keyObj里的对应值
 * @param {Array} dataArr
 * @param {Object} keyObj
 * @param {Boolean} isKeyObj
 * @returns {Array}
 * @example see @/views/order/orderImport
 * @description 改变Obj数据的key
 */
export function changeArrKey(dataArr, keyObj, isKeyObj = false) {
  return dataArr.map(item => {
    return changeObjKey(item, keyObj, isKeyObj)
  })
}

export function uniqueArray(arr) {
  return arr.filter((item, index, arr) => arr.indexOf(item) === index)
}

export function getArrFromStr(val, separator = /\s+|，|,/) {
  return val.split(separator).filter(Boolean)
}

/**
 * @param {Number|String} value
 * @param {Array} dic
 * @param {Object} props
 * @returns {String}
 * @example see @/views/order/relationDetails
 * @description 字典，根据value获取label
 */
export function getDicLabel(value, dic = [], props = {label: 'label', value: 'value'}) {
  // console.log(value, dic, props);
  let item = dic.find(item => item[props.value] === value)
  return item ? item[props.label] : ''
}

/**
 * @param {String} label
 * @param {Array} dic
 * @param {Object} props
 * @returns {String|Number}
 * @example see @/views/order/relationDetails
 * @description 字典，根据label获取value
 */
export function getDicValue(label, dic = [], props = {label: 'label', value: 'value'}) {
  // console.log(value, dic, props);
  let item = dic.find(item => item[props.label] === label)
  return item ? item[props.value] : ''
}


let queue = Promise.resolve()
let promises = []
let limit
requestLimitNum(6)
export function requestLimitNum(num) {
  limit = num
  for (let i = 0; i < limit; i++) {
    promises.push(Promise.resolve(i))
  }
  promises.length = limit
}
export function requestQueue(func) {
  queue = queue
    .then(() => {
      return Promise.race(promises)
    })
    .catch((err) => {
      // 这里的 catch 不仅用来捕获前面 then 方法抛出的错误
      // 更重要的是防止中断整个链式调用
      console.error(err)
    })
    .then((res) => {
      promises[res] = func().then(() => {
        return res
      })
    })
}

/**
 * 对obj进行取值（处理obj的多级取值，防止在某一级取不到值导致后续取值操作报错）
 * @param {any} obj
 * @param {string} keyStr
 * @returns {any}
 * @example getValueFromObj(obj, 'introduce_attr[0].introduce_detail')
 */
export function getValueFromObj(obj, keyStr = '') {
  if(!obj) return obj
  let keys = keyStr.replace(/\/|\[|\].?/g, '.').split('.')
  // console.log(keys);
  return keys.reduce((prev, key, index, arr) => {
    if(!key) return prev
    let value
    try {
      value = prev[key]
    } catch (e) {
      arr.splice(index)
      return undefined
    }
    if (value === null || value === undefined) {
      arr.splice(index)
      return undefined
    }
    // console.log(value);
    return value
  }, obj)
}

export function handleWebPaymentForm(webPaymentForm) {
  if (!webPaymentForm) return
  const div = document.createElement('div')
  div.style.visibility = 'hidden'
  div.style.width = '0'
  div.style.height = '0'
  div.innerHTML = webPaymentForm
  document.body.appendChild(div)
  // console.log(webPaymentForm, div.getElementsByTagName('form'))
  div.getElementsByTagName('form')[0].submit()
}


export function rewriteMap(arr, params) {
  if (!Array.isArray(arr) || !Array.isArray(params)) return map(arr, params)
  let lastIndex = params.length - 1
  return params.reduce((prev, next, index) => {
    if (index === lastIndex) return map(prev, next)
    return flattenDepth(map(prev, next))
  }, arr)
}

/**
 * 合并驼峰和中划线的prop，一般用于组件封装时对prop的处理
 * @param args
 * @returns {{}|*}
 */
export function assignProps(...args) {
  //筛选掉非对象的参数
  args = args.filter(item => isPlainObject(item))
  if (!args.length) return {}
  if (args.length == 1) return args[0]
  const [from, to] = args.splice(0, 2)
  const $mergeType = to.$mergeType

  const tmpObj = Object.keys(to).reduce((cur, prop) => {
    const camelCaseProp = camelCase(prop)
    if ($mergeType) {
      cur[camelCaseProp] = getMergeTypeData(from, to, prop)
    } else {
      const fromVal = from[prop]
      if (!isUndefined(fromVal)) delete cur[prop]
      cur[camelCaseProp] = to[prop]
    }
    return cur
  }, { ...from })
  delete tmpObj.$mergeType
  delete tmpObj.$mergeChar
  return assignProps(tmpObj, ...args)

  /**
   *保留上次的值，并且合并新值。根据类型合并 Array | String | Object
   * @param from
   * @param to
   * @param prop
   * @returns {string|{}|*[]|*}
   */
  function getMergeTypeData(from, to, prop) {
    const $mergeType = to.$mergeType
    const $mergeChar = validData(to.$mergeChar, ' ')
    const camelCaseProp = camelCase(prop)
    const fromVal = validData(from[prop], from[camelCaseProp])
    const toVal = to[prop]
    let [arrayInitData, objectInitData, stringInitData] = [[], {}, '']
    if (!isUndefined(fromVal)) {
      isArray(fromVal) ? arrayInitData.push(...fromVal) : arrayInitData.push(fromVal)
      isPlainObject(fromVal) ? (objectInitData = fromVal) : (objectInitData[camelCaseProp] = fromVal)
      stringInitData = fromVal
    }
    if (/array/ig.test($mergeType)) {
      isArray(toVal) ? arrayInitData.push(...toVal) : arrayInitData.push(toVal)
      return from[camelCaseProp] = arrayInitData
    }
    if (/object/ig.test($mergeType)) {
      isPlainObject(toVal) ? (objectInitData = { ...objectInitData, ...toVal }) : (objectInitData[camelCaseProp] = fromVal)
      return from[camelCaseProp] = objectInitData
    }
    if (/string/ig.test($mergeType)) {
      stringInitData = stringInitData + $mergeChar + toVal
      return from[camelCaseProp] = stringInitData
    }
    return from[camelCaseProp]
  }
}

export function getSplitAttrs(attrs, prefixList) {
  const defaultPrefix = prefixList.default
  prefixList = cloneDeep(prefixList)
  delete prefixList.default
  const tmpObj = Object.values(prefixList).reduce((cur, prev) => {
    cur[prev] = {}
    return cur
  }, {})
  const prefixKeys = Object.keys(prefixList)
  Object.keys(attrs).map(key => {
    const camelCaseKey = camelCase(key)
    let fItem = prefixKeys.find(prefix => camelCaseKey.indexOf(prefix) == 0)
    if (!fItem) {
      if (!defaultPrefix) return
      fItem = defaultPrefix
    }
    const pureKey = lowerFirst(camelCaseKey.replace(fItem, ''))
    const prop = `${prefixList[fItem]}.${pureKey}`
    set(tmpObj, prop, attrs[key])
  })
  return tmpObj
}
