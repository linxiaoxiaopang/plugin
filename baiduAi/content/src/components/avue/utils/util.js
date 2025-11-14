/* eslint-disable */
import { validatenull, isNumber } from './validate'
import store from '@/store'
import axios from 'axios'
import { Message } from 'element-ui'
import { merge, omit, get } from 'lodash'
import { FormatObject } from '@/utils/format/object'
import { getResult } from '@/utils/functional'

/**
 * 根据字典的value和字典值key显示label
 * @param {string} key
 * @param value
 * @return
 */
export function getLabel (key, value) {
  store.dispatch('GetDic', key)
  let aDic = store.state.dic[key]
  return findByvalue(aDic.dicData, value, aDic.props)
}
/**
 * @description: 获取判断条件复杂的字典子项
 * @param dic {Object|Array}
 * @param data {Object}
 * @param paramsKey {String}
 */
export function getDicItemComplex(dic, data, paramsKey = 'statusParams') {
  if (!dic) return
  if (getObjType(dic) === 'object') dic = Object.values(setValueByKey(dic))
  
  return dic.find(item => {
    const { [paramsKey]: statusParams } = item
    if (validatenull(statusParams)) {
      return item.value === data.value
    }
    
    if (typeof statusParams === 'function') return statusParams(data)
    return Object.entries(statusParams).every(([key, value]) => get(data, key) === value)
  })
}
export function getDicItemComplexDeep(dic, data, paramsKey = 'statusParams') {
  const item = getDicItemComplex(dic, data, paramsKey)
  return item?.children ? getDicItemComplexDeep(item.children, data, paramsKey) : item
}
export function setValueByKey(obj) {
  if (!obj) return
  for (const key in obj) {
    obj[key].value = validData(obj[key].value, key)
  }
  return obj
}
export function getOption(options, key) {
  const option = options[key] || getDicItemComplex(options, key)
  if (option) {
    return options.merge
      ? {
        ...options.merge,
        ...option
      }
      : option
  }
  return options.default
}
/**
 * 将树形数据转化为dic数据
 */
export function toDic(dic) {
  let tempArr = []
  dic.map((treeItem) => {
    tempArr.push(treeItem)
    let children = treeItem.children
    if (!validatenull(children)) tempArr = tempArr.concat(toDic(children))
  })
  return tempArr
}
/**
 * 删除dic数据中空的children
 */
export function delDicEmptyChildren(dic) {
  if (!Array.isArray(dic)) return dic
  return deepClone(dic).map((dicItem) => {
    let children = dicItem.children
    if (validatenull(children)) {
      dicItem.children = undefined
    } else if (Array.isArray(children)) {
      dicItem.children = delDicEmptyChildren(children)
    }
    return dicItem
  })
}
/**
 * 根据字典的value显示label
 */
export function findByvalue(dic, value, props = { label: 'label', value: 'value' }) {
  // console.log('findByvalue', dic, value, props);
  let result = ''
  if (validatenull(dic)) return value
  dic = toDic(dic)
  if (typeof value == 'string' || typeof value == 'number' || typeof value == 'boolean') {
    let index = 0
    index = findArray(dic, value, props)
    if (index != -1) {
      result = dic[index][props.label]
    } else {
      result = value
    }
  } else if (value instanceof Array && dic[0].children) {
    let index = 0
    let count = 0
    while (count < value.length) {
      index = findArray(dic, value[count], props)
      if (!validatenull(dic[index])) {
        result = result + dic[index][props.label] + '/'
        dic = dic[index].children
      }
      count++
    }
    result = result.substr(0, result.length - 1)
  } else if (value instanceof Array) {
    result = []
    let index = 0
    value.forEach((ele) => {
      index = findArray(dic, ele, props)
      if (index != -1) {
        result.push(dic[index][props.label])
      } else {
        result.push(ele)
      }
    })
    result = result.toString()
  }
  return result
}
/**
 * 根据字典的value查找对应的index
 */
export function findArray(dic, value, props = { label: 'label', value: 'value' }) {
  // console.log('findArray', dic, value, props);
  for (let i = 0; i < dic.length; i++) {
    if (dic[i][props.value] == value) {
      return i
    }
  }
  return -1
}
/**
 * 获取字典
 */
export function setDic({ dicData, dicType, prop }, DIC = {}) {
  return Array.isArray(dicData) && !validatenull(dicData) ? dicData : validData(DIC[dicData], DIC[dicType], DIC[prop], undefined)
}
/**
 * 设置px
 */
export function setPx(...rest) {
  let val = validData(...rest)
  if (validatenull(val)) return val
  val = val + ''
  if (val.indexOf('%') === -1 && isNumber(val)) {
    val = val + 'px'
  }
  return val
}

/**
 * 搜索框获取动态组件
 */
export function getSearchType(type) {
  if (type == 'select' || type == 'checkbox') {
    return 'crudSelect'
  } else if (type == 'radio') {
    return 'crudRadio'
  } else if (type == 'time') {
    return 'crudTime'
  } else if (['date', 'datetime', 'daterange', 'year', 'month', 'monthrange'].includes(type)) {
    return 'crudDate'
  } else if (type == 'cascader') {
    return 'crudCascader'
  } else if (type == 'number') {
    return 'crudInputNumber'
  } else {
    return 'crudInput'
  }
}

/**
 * 动态获取组件
 */
export function getComponent(type) {
  if (type == 'select') {
    return 'crudSelect'
  } else if (type == 'radio') {
    return 'crudRadio'
  } else if (type == 'checkbox') {
    return 'crudCheckbox'
  } else if (type == 'time') {
    return 'crudTime'
  } else if (['date', 'datetime', 'datetimerange', 'daterange', 'year', 'month', 'monthrange'].includes(type)) {
    return 'crudDate'
  } else if (type == 'cascader') {
    return 'crudCascader'
  } else if (type == 'number') {
    return 'crudInputNumber'
  } else if (type == 'ueditor') {
    return 'crudUeditor'
  } else if (type == 'upload') {
    return 'crudUpload'
  } else if (type == 'fileUpload') {
    return 'crudFileUpload'
  } else if (type == 'switch') {
    return 'avue-switch'
  } else if (type == 'password') {
    return 'crudInput'
  } else {
    return 'crudInput'
  }
}

/**
 * 动态获取组件
 */
export function getSingleComponent(type) {
  if (type == 'select') {
    return 'avueCrudSelect'
  } else if (type == 'radio') {
    return 'avueCrudRadio'
  } else if (type == 'checkbox') {
    return 'avueCrudCheckbox'
  } else if (type == 'time') {
    return 'avueCrudTime'
  } else if (type == 'date' || type == 'datetime' || type == 'daterange') {
    return 'avueCrudDate'
  } else if (type == 'cascader') {
    return 'avueCrudCascader'
  } else if (type == 'number') {
    return 'avueCrudInputNumber'
  } else if (type == 'ueditor') {
    return 'avueCrudUeditor'
  } else if (type == 'upload') {
    return 'avueCrudUpload'
  } else if (type == 'fileUpload') {
    return 'avueCrudFileUpload'
  } else if (type == 'password') {
    return 'avueCrudInput'
  } else {
    return 'avueCrudInput'
  }
}

/**
 * get请求数据缓存
 */
export function httpGet(httpGet) {
  let httpGetCache = {}
  return function (url) {
    if (httpGetCache[url]) return httpGetCache[url]
    
    httpGetCache[url] = httpGet(url).catch((err) => {
      httpGetCache[url] = null
      return Promise.reject(err)
    })
    return httpGetCache[url]
  }
}

export function getURLData(url, config = {}) {
  return axios
    .get(url, {
      responseType: 'blob',
      ...config
    })
    .then((res) => {
      const { status, data } = res || {}
      if (status >= 200 && status < 300) {
        const fileReader = new FileReader()
        const p = new Promise((resolve, reject) => {
          fileReader.onloadend = function (e) {
            e.data = data
            e.size = data.size
            resolve(e)
          }
        })
        fileReader.readAsDataURL(data)
        return p
      }
    })
    .catch((err) => {
      const { message } = err
      if (message && message.cancelMessage) {
        Message.success('取消下载成功')
      }
      console.log(err)
      return false
    })
}

/**
 * post请求数据缓存
 */
export const httpPost = (httpPost) => {
  let httpPostCache = {}
  return function (url) {
    if (httpPostCache[url]) return httpPostCache[url]
    
    httpPostCache[url] = httpPost(url, {}).catch((err) => {
      httpPostCache[url] = null
      return Promise.reject(err)
    })
    return httpPostCache[url]
  }
}

export const getObjType = function getObjType(obj) {
  var toString = Object.prototype.toString
  var map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object',
    '[object Promise]': 'promise'
  }
  if (obj instanceof Element) {
    return 'element'
  }
  return map[toString.call(obj)]
}

export function hasOwnProperty(obj, key) {
  return getObjType(obj) === 'object' && obj.hasOwnProperty(key)
}
export function hasOwnProperties(obj, keys) {
  return keys.some(key => hasOwnProperty(obj, key))
}
/**
 * 对象深拷贝
 */
export function deepClone(data) {
  var type = getObjType(data)
  var obj
  if (type === 'array') {
    obj = []
  } else if (type === 'object') {
    obj = {}
  } else {
    // 不再具有下一层次
    return data
  }
  if (type === 'array') {
    for (var i = 0, len = data.length; i < len; i++) {
      delete data[i].$parent
      obj.push(deepClone(data[i]))
    }
  } else if (type === 'object') {
    for (var key in data) {
      delete data.$parent
      obj[key] = deepClone(data[key])
    }
  }
  return obj
}
/*
 * 对象部分键值对深拷贝
 * */
export function keyClone(data, keys = []) {
  let obj = {}
  for (const key in data) {
    if (keys.includes(key)) {
      obj[key] = deepClone(data[key])
    }
  }
  return obj
}

export function vaildData(val, dafult) {
  if (typeof val == 'boolean') {
    return val
  }
  return !validatenull(val) ? val : dafult
}
export function validData(val, ...rest) {
  if (!rest.length) return val
  return vaildData(val, validData(...rest))
}
export function validFn(fns, ...args) {
  fns = [].concat(fns)
  for (const fn of fns) {
    const val = getResult(fn, ...args)
    if (!validatenull(val)) return val
  }
}

export function isDiffData(nData, oData, ignoreProps = []) {
  let diffData = getDiffData(nData, oData)
  ignoreProps.forEach((prop) => {
    delete diffData[prop]
  })
  return diffData === undefined ? false : diffData
}
export function validateDiffData(nData, oData, ignoreProps = []) {
  let diffData = {
    ...getDiffData(oData, nData),
    ...getDiffData(nData, oData)
  }
  ignoreProps.forEach((prop) => {
    delete diffData[prop]
  })
  return validatenull(diffData) ? false : diffData
}
/**
 * @param {any} nData
 * @param {any} oData
 * @returns {Object}
 * @example see
 */
export function getDiffData(nData, oData, { isStrict } = {}) {
  let nType = getObjType(nData)
  let oType = getObjType(oData)
  let obj
  
  if (nType === 'array' && oType === 'array') {
    let tempArr = []
    for (var i = 0, len = nData.length; i < len; i++) {
      if (nData[i]) delete nData[i].$parent
      let nVal = nData[i]
      let oVal = oData[i]
      let diffData = getDiffData(nVal, oVal)
      if (diffData !== undefined) tempArr.push(diffData)
    }
    if (!validatenull(tempArr)) obj = tempArr
  } else if (nType === 'object' && oType === 'object') {
    let tempObj = {}
    for (var key in nData) {
      delete nData.$parent
      let nVal = nData[key]
      let oVal = oData[key]
      let diffData = getDiffData(nVal, oVal)
      if (diffData !== undefined) tempObj[key] = diffData
    }
    if (!validatenull(tempObj)) obj = tempObj
  } else {
    if (!isStrict) {
      if (nData == oData) {
        if (isNumber(nData) && isNumber(oData)) {
          return
        }
      }
    }
    if (nData !== oData) {
      obj = nData
    }
  }
  
  return obj
}
export function getReorderDiffData(nData, oData, key = 'id', param) {
  let tempObj = {}
  oData.forEach((item) => (tempObj[item[key]] = item))
  let res = nData
    .map((item) => {
      let diffData = getDiffData(item, tempObj[item[key]], param)
      if (diffData) {
        diffData[key] = item[key]
        return diffData
      }
    })
    .filter(Boolean)
  if (res.length) return res
}

/*
 * 将数组arr中oIndex下标的元素移至nIndex处，数组个数不变
 * */
export function changeIndex(arr, oIndex = 0, nIndex = oIndex) {
  if (oIndex === nIndex) return arr
  arr.splice(nIndex, 0, arr.splice(oIndex, 1)[0])
  return arr
}

export function getAddAndDelList(nArr, oArr, key) {
  if (key) {
    nArr = nArr.map((column) => column[key])
    oArr = oArr.map((column) => column[key])
  }
  return {
    addList: nArr.filter((prop) => !oArr.includes(prop)),
    delList: oArr.filter((prop) => !nArr.includes(prop))
  }
}
export function getAddAndDelListFromObj(nObj, oObj, props, key) {
  let tempObj = {}
  props.forEach((prop) => {
    tempObj[prop] = getAddAndDelList(nObj[prop] || [], oObj[prop] || [], key)
  })
  return tempObj
}

export function keyAssign(nObj, oObj, keys) {
  keys = Array.isArray(keys) ? keys : [keys]
  keys.forEach((key) => {
    nObj[key] = oObj[key]
  })
  return nObj
}
/*
 * 在不改变nObj存储地址的前提下，将nObj的键值对设置为oObj的键值对
 * */
export function objectAssign(nObj, oObj) {
  let diffData = validateDiffData(nObj, oObj)
  if (!diffData) return
  Object.assign(nObj, diffData)
  return nObj
}
/*
 * 为对象的键设置默认值
 * */
export function setDefault(data, types = {}) {
  if (!data) return
  let array = []
  let object = []
  if (Array.isArray(types)) {
    array = types
  } else {
    array = types.array || []
    object = types.object || []
  }
  
  data = Array.isArray(data) ? data : [data]
  data.forEach((obj) => {
    array.forEach((key) => (obj[key] = obj[key] || []))
    object.forEach((key) => (obj[key] = obj[key] || {}))
  })
  return data
}

export function getPageData(data, { pageIndex, pageSize }) {
  return data?.slice((pageIndex - 1) * pageSize, pageIndex * pageSize) || []
}

export function formatDic(dic, props) {
  const DEFAULT_PROPS = { label: 'label', value: 'value', children: 'children' }
  const { children } = props = merge({}, DEFAULT_PROPS, props)
  const map = {
    ...props,
    own(data, result) {
      Object.assign(result, omit(data, Object.keys(props)))
    },
    children(data) {
      if (data[children]) {
        return formatDic(data[children], props)
      }
    }
  }
  return FormatObject.formatArray(dic, map)
}