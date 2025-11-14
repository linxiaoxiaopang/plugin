/* eslint-disable */
import Vue from 'vue'
import store from '@/store'
import router from '@/router'
import { Loading, Message } from 'element-ui'
//获取坐标效果图
import { flatMapDeep, isPlainObject, uniq, isArray, isString, upperFirst } from 'lodash'
import { getPicName, conversionCMToIN } from '@/utils'
import { validData } from '@/components/avue/utils/util'
import { formatDate } from 'element-ui/src/utils/date-util'
import { accMul } from '@/utils/calculate'
import { getUUID } from '@/utils'

/**
 * @description: 创建打印的后掉列表
 * @param {Object} printData
 * @param {Function} callback 关闭打印发射事件
 * @return {Object} 回调列表
 */
export function createPrintCallbackParams(printData, startCallback, afterCallback) {
  const { documentTitle, name = '' } = printData
  let loadingInstance = null
  let historyDocumentTitle = null
  const defaultPrintData = {
    documentTitle,
    name,
    type: 'pdf',
    printable: require('@/assets/images/default.png'),
    scanStyles: false,
    onLoadingStart: () => {
      loadingInstance = Loading.service({
        lock: true,
        text: `生成${documentTitle}中`
      })
      startCallback && startCallback()
      //存储历史的网页标题
      //通过更改网页标题来更改保存时打印标题文件的标题
      historyDocumentTitle = document.title
      document.title = name
    },
    onLoadingEnd: () => {
      loadingInstance.close()
      afterCallback && afterCallback()
      document.title = historyDocumentTitle
    },
    onError: (err) => {
      Message.error('打印失败')
      loadingInstance.close()
    }
  }
  return {
    ...defaultPrintData,
    ...printData,
    documentTitle,
    name
  }
}

export function getPrimShowImgs(data) {
  try {
    return data.map(({ prim_show_groups }) => {
      prim_show_groups = Array.isArray(prim_show_groups) ? prim_show_groups : []
      if (!prim_show_groups.length) {
        return false
      }
      const { prim_show_img = [] } = prim_show_groups[0] || {}
      console.log('prim_show_img', prim_show_img)
      return prim_show_img || []
    })
  } catch (err) {
    return false
  }
}

/**
 * 获取格式化时间
 * @param date
 * @param format
 * @returns {string|*}
 */
export function getFormatData(date = new Date(), format = 'yyyy-MM-dd HH:mm:ss') {
  return formatDate(date, format)
}

// 获取批次号
export function getBatchCode(date = new Date(), format = 'yyyyMMddHHmmss') {
  return formatDate(date, format) + getUUID().slice(0, 4)
}

export function formDataAppendArray(formData, data, key) {
  for (let i = 0; i < data.length; i++) {
    const val = data[i]
    if (Array.isArray(val)) {
      for (let j = 0; j < val.length; j++) {
        const sVal = val[j]
        formData.append(key, sVal)
      }
    } else {
      formData.append(key, val)
    }
  }
}

export function formatPutOnAndOffData(data) {
  return data.map((item) => {
    const { id, prim_struct, name, detail, sizes } = item
    prim_struct.map((struct) => (struct.status = false))
    sizes.map((size) => (size.status = false))
    return {
      prim_struct,
      name,
      detail,
      sizes,
      status: false,
      id,
      message: {
        status: true,
        text: ''
      }
    }
  })
}

/**
 * @description: 扁平化处理一个 原型数组所在的对象
 * @param {Object} data
 * @return {Array} 白板图所在的对象列表
 */
export function flatMapDeepShowImageGroupItem(data) {
  const mapArr = ['styleList', 'showImageGroupList', 'showImageGroupItemList']
  if (data.productPrototypeList) mapArr.unshift('productPrototypeList')
  return flatMapDeepByArray(data || {}, mapArr)
}

/**
 * @description: 扁平化数组或对象
 * @param Array | Object  被扁平化的数组|对象
 * @param Array 扁平化字段列表
 * @return {Array
 */
export function flatMapDeepByArray(data, mapArr = [], mapKeyArr = [], needFill = false) {
  let flatMapArr = []
  if (!mapArr.length) return []
  if (isPlainObject(data)) {
    const shiftData = data[mapArr.shift()]
    flatMapArr = Array.isArray(shiftData) ? shiftData : [shiftData]
  } else {
    flatMapArr = data
  }
  //兼容旧方法
  if (!mapKeyArr || !mapKeyArr.length) {
    for (let i = 0; i < mapArr.length; i++) {
      flatMapArr = flatMapDeep(flatMapArr, (n) => {
        //防止n[mapArr[i]]是undefined报错
        return n[mapArr[i]] || []
      })
    }
    return flatMapArr.filter(Boolean)
  }
  //重置mapKeyArr
  mapKeyArr = mapKeyArr.slice(0, mapArr.length)
  for (let i = 0; i < mapArr.length; i++) {
    flatMapArr = flatMapDeep(flatMapArr, (n) => {
      const arr = $GET(n, `${[mapArr[i]]}`, [])
      const sliceKeyArr = mapKeyArr.slice(0, i + 1)
      const sliceMapArr = mapArr.slice(0, i + 1)
      sliceKeyArr.map((key, k) => {
        arr.map((nItem, index) => {
          nItem.$index = index
          if (k == sliceMapArr.length - 1) {
            return (nItem[`$${key}`] = n)
          }
          nItem[`$${key}`] = n[`$${key}`]
        })
      })
      return arr
    })
  }
  //需要填充
  if (needFill) flatMapArr.map((item) => fillProps(item, mapKeyArr))
  return flatMapArr
}

/**
 * @description: 数组填充属性值
 * @param Array | Object  待处理的对象
 * @param Array 待填充的对象
 * @return
 */
export function fillProps(obj, props) {
  if (!isArray(props)) props = [props]
  props = props.map(prop => `$${prop}`)
  props.map(prop => {
    const val = obj[prop]
    if (!isPlainObject(val)) return
    for (let key in val) {
      const valKey = obj[key] ? `${prop}${upperFirst(key)}` : key
      obj[valKey] = val[key]
    }
  })
}


/**
 * @description: 查找白板图所在的对象
 * @param {Array} data  productPrototypeList 原型对象数组
 * @param {Number} id
 * @return {Object}
 */
export function findShowImageGroupItem(data, id) {
  return flatMapDeepShowImageGroupItem(data).find((item) => item.id == id)
}

/**
 * @description: 根据 bottomBoardList列表的创建时间和更新时间，获取最早的创建时间和最晚的更新时间
 * @param {Object}
 * @return {Object} {createTime: '最早的创建时间， updateTime： 最晚更新时间}
 */
export function getBottomBoardListTimeList(row) {
  try {
    const timeObj = {}
    row.bottomBoardList.map((item) => {
      const { createTime, updateTime } = item
      if (!timeObj.createTime) {
        timeObj.createTime = createTime
      }
      if (!timeObj.updateTime) {
        timeObj.updateTime = updateTime
      }
      if (new Date(createTime) <= new Date(timeObj.createTime)) {
        timeObj.createTime = createTime
      }

      if (new Date(updateTime) >= new Date(timeObj.updateTime)) {
        timeObj.updateTime = updateTime
      }
    })
    return timeObj
  } catch {
    return {}
  }
}

/**
 * 根据上传的fileList 校验图片名称
 * @param data
 * @param isMsg
 * @returns {(boolean|*)[]}
 */
export function checkPicName(data, isMsg = true) {
  const titles = data.map(({ name }) => getPicName(name))
  //字符错误列表
  const charErrList = []
  const errList = titles.reduce((cur, prev) => {
    const matchRes = prev.match(/\$|,|，/g)
    if (matchRes) {
      cur.push(prev)
      charErrList.push(...matchRes)
    }
    return cur
  }, [])
  const err = !!errList.length
  let errMsg
  if (err) {
    errMsg = `${errList.join('、')}图片异常，存在非法字符“${uniq(charErrList).join('、')}”`
    isMsg && Message.error(errMsg)
  }
  return [err, errList, errMsg]
}

//设置setTimeout延迟
export async function waitTimeByNum(num) {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, num)
  })
}

/**
 * .js文件监听store中的字段
 * @param prop
 * @param data
 * @param isGetters
 */
export function storeWatcher(prop, data, isGetters = true) {
  store.watch(
    (state, getters) => {
      if (!isGetters) return $GET(state, prop, [])
      return $GET(getters, prop, [])
    },
    (newVal) => {
      data.length = 0
      data.push(...validData(newVal, []))
    }
  )
}

/**
 * 跳转页面的message
 * @param option
 */
export let linkPageMessage = function (option) {
  //第一次调用之后，重载linkPageMessage
  linkPageMessage = (function createLinkPageMessage() {
    const vm = new Vue({
      router
    })
    const h = vm.$createElement
    return function (option = {}) {
      const renderMessage = validData(option.renderMessage, '操作成功。')
      const routerToOption = validData(option.routerToOption, { path: '/' })
      const click = option.click
      const routerTxt = validData(option.routerTxt, '点击前往>>')
      const defaultOption = {
        type: 'success',
        message: h(
          'div',
          {
            staticClass: 'flex-center-between w100'
          },
          [
            h('span', renderMessage),
            h(
              'a',
              {
                style: { color: '#1f5fff', marginLeft: '10px' },
                on: {
                  click: (evt) => {
                    evt.preventDefault()
                    if (click) {
                      click()
                    } else {
                      vm.$router.replace(routerToOption)
                    }
                  }
                }
              },
              routerTxt
            )
          ])
      }
      vm.$message(Object.assign({}, defaultOption, option))
    }
  })()
  linkPageMessage(option)
}

/**
 * 转换尺码属性
 * @param sizeList
 * @param oldSizeAttribute
 * @param sizeAttributeList
 * @returns {{prop: string, minWidth: number, label: string}[]}
 */
export function convertSizeAttribute(sizeList, oldSizeAttribute, sizeAttributeList) {
  const baseCol = [{ prop: 'sizeName', label: '尺码', minWidth: 100 }]
  let concatCol = []
  if (!isArray(sizeList)) sizeList = []
  if (oldSizeAttribute) {
    concatCol = formatOldSizeAttribute()
  } else {
    concatCol = formatSizeAttributeList()
  }
  return baseCol.concat(concatCol)

  function formatOldSizeAttribute() {
    const introduceDetail = parseJSON($GET(oldSizeAttribute, 'introduceDetail', []))
    if (!isArray(introduceDetail) && !introduceDetail.length) return []
    const firstChild = introduceDetail[0]
    const tmpColArr = []
    for (let key in firstChild) {
      const label = (firstChild[key]?.label || '').split('|')[0]
      tmpColArr.push({
        label: label + '(cm/in)',
        prop: key,
        minWidth: 100
      })
    }
    sizeList.map((item, index) => {
      const curVal = introduceDetail[index]
      if (!curVal) return
      for (let key in curVal) {
        const { value } = curVal[key]
        item[key] = `${parseNumber(value)}/${parseNumber(conversionCMToIN(value))}`
      }
    })
    return tmpColArr

    function parseJSON(jsonStr) {
      try {
        return JSON.parse(jsonStr)
      } catch {
        return {}
      }
    }
  }

  function formatSizeAttributeList() {
    if (!isArray(sizeAttributeList) || !sizeAttributeList.length || !sizeList.length) return []
    const tmpColArr = []
    const firstSize = sizeList[0]
    const firstSizeAttributeList = sizeAttributeList.filter(sItem => sItem.sizeId == firstSize.id)
    firstSizeAttributeList.map(item => {
      const attrItemId = $GET(item, 'attrItemId', '')
      const { isUnitConversion, chineseName, unit } = $GET(item, 'attributeItem', {})
      tmpColArr.push({
        label: `${chineseName}(${unit}${needUnitConversion(isUnitConversion) ? '/in' : ''})`,
        prop: createProp(attrItemId),
        minWidth: 100
      })
    })
    sizeList.map(item => {
      const sameSizeAttributeList = sizeAttributeList.filter(sItem => sItem.sizeId == item.id)
      sameSizeAttributeList.map(sItem => {
        const value = sItem.itemValue
        const prop = createProp($GET(sItem, 'attrItemId', ''))
        const { isUnitConversion, conversionRatio } = $GET(sItem, 'attributeItem', {})
        const curValue = isEmptyStr(value) ? '' : minValue(value)
        if (!needUnitConversion(isUnitConversion)) {
          item[prop] = curValue
        } else {
          const splitValue = getSplitValue(value)
          if (isEmptyStr(splitValue)) {
            item[prop] = ''
            return
          }
          const curInValue = splitValue.reduce((cur, prev) => {
            cur += minValue(accMul(prev, conversionRatio)) + '-'
            return cur
          }, '').replace(/-$/, '')
          // const curInValue = minValue(parseNumber(accMul(value, conversionRatio)))
          item[prop] = `${curValue}/${curInValue}`
        }
      })
    })
    return tmpColArr

    function getRegexp() {
      return /-/
    }

    function getSplitValue(value) {
      if (!value) return value
      if (!isString(value)) {
        return [value]
      }
      return value.split(getRegexp()).filter(Boolean)
    }

    function isEmptyStr(value) {
      return !value
    }

    function needUnitConversion(isUnitConversion) {
      return !!isUnitConversion
    }

    function createProp(val) {
      return 'attr_' + val
    }

    function minValue(val, minValue = 0.01) {
      const { max } = Math
      if (isString(val) && val.match(getRegexp())) {
        return val
      }
      return max(parseNumber(val), minValue)
    }
  }
}

export function replaceErrMsg(err) {
  if (isString(err)) return err
  if (err.message) return err.message
  err.name = ''
  return err.toString()
}

export function deleteDeep(value, callback) {
  // 处理基本数据类型和 null
  if (value === null || typeof value !== 'object') {
    return value
  }

  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      const bool = callback(value, key)
      if (!bool) continue
      deleteDeep(value[key], callback)
    }
  }
}

/**
 * 创建promise
 * @returns {{resolve: function, promise: Promise<unknown>}}
 */
export function createPromise() {
  let resolveHandler = null
  let rejectHandler = null
  const p = new Promise((resolve, reject) => {
    resolveHandler = resolve
    rejectHandler = reject
  })
  return {
    resolve: resolveHandler,
    reject: rejectHandler,
    promise: p
  }
}

export function tipErrorMessage(err) {
  const errMsg = replaceErrMsg(err)
  Message.error(errMsg)
}
