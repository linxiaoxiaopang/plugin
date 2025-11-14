/* eslint-disable */
import request from '@/service/request'
import { validatenull } from '@/components/avue/utils/validate'
import { requestLimitNum, requestQueue } from '@/utils'
import { GET_REQUEST_PREFIX, getXMenuType } from '@/utils/constant/menuConst'
import { REQUEST_ALL_DATA } from '@/utils/constant/requestConst'
import { validData } from '@/components/avue/utils/util'
import { isArray, isPlainObject, merge, flattenDeep, chain, flatMap, trim } from 'lodash'
import { getDicName } from '@/components/avue/core/dic'
import { IS_PRODUCTION } from '@/utils/constant/systemConst'

function getDic(option) {
  return request({
    headers: getXMenuType(),
    method: 'post',
    ...option,
    data: {
      ...REQUEST_ALL_DATA,
      ...option.data
    },
    url: GET_REQUEST_PREFIX(option.url)
  })
}

/**
 * 新增全部项
 * @param dic
 * @param allLabel
 * @returns {*}
 */
function unshiftAllLabel(dic, allLabel) {
  if (!isArray(dic)) return dic
  if (isPlainObject(allLabel)) {
    dic.unshift(allLabel)
  } else {
    dic.unshift({
      label: allLabel,
      value: 'all',
      id: 'all'
    })
  }
}

// 当type值为以下任意一项，设置dicData和props
let hasDicType = ['select', 'radio', 'checkbox', 'cascader']
const dic = {
  mutations: {
    // 设置dicData
    SET_DIC_DATA: (state, { prop, dicData } = {}) => {
      if (!prop || !state[prop]) return
      state[prop].dicData = dicData
      
      let { partParams, partData, allLabel } = state[prop]
      
      if (partParams && partData && Array.isArray(dicData)) {
        let partKeys = Object.keys(partParams)
        partKeys.forEach((partKey) => {
          let partParam = partParams[partKey]
          if (typeof partParam === 'function') {
            partData[partKey] = partParam(dicData)
          } else {
            let partParamKeys = Object.keys(partParam)
            partData[partKey] = dicData.filter((dicItem) =>
              partParamKeys.every((key) => dicItem[key] === partParam[key])
            )
          }
        })
      }
      //新增全部选项
      if (allLabel) unshiftAllLabel(dicData, allLabel)
    }
  },
  
  actions: {
    MultipleGetDic({ dispatch }, props = []) {
      return promiseAll(props.map(async (prop) => await dispatch('GetDic', prop)))
    },
    // 根据dictType获取字典
    GetDict({ state, commit }, dictType) {
      return new Promise(async (resolve) => {
        let res1 = await awaitResolve(
          getDic({
            url: '/systemService/dictionary/list',
            data: {
              dictType
            }
          })
        )
        if (validatenull(res1?.detail[0]?.id)) return resolve([])
        
        let res2 = await awaitResolve(
          getDic({
            url: '/systemService/dictionaryItem/list',
            data: {
              dictId: res1?.detail[0]?.id
            }
          })
        )
        if (!res2) return resolve([])
        resolve(res2.detail || [])
      })
    },
    // 获取字典
    GetDic({ state, commit, dispatch }, prop) {
      let dic = state[prop]
      if (!dic) return []
      
      if (dic.dicData) return dic.dicData
      // 表示正在请求，保存resolve，在请求结束后，统一返回数据
      if (dic.loading && dic.resolves) return new Promise(resolve => dic.resolves.push(resolve))
      
      return new Promise(async (resolve) => {
        if (!dic.resolves) dic.resolves = []
        dic.loading = true
        
        let dicData = []
        let curRequest
        if (dic.url) {
          curRequest = dic.lastRequest = awaitResolve(getDic(dic))
          let res = await curRequest
          dicData = res?.detail || []
        } else if (dic.dictType) {
          curRequest = dic.lastRequest = dispatch('GetDict', dic.dictType)
          dicData = await curRequest
        }
  
        dicData = dicToCommon(dicData, dic.props)
        if (dic.handleDicData) dicData = dic.handleDicData(dicData || []) || dicData
        
        // 多次请求时，返回最后一次请求数据
        if (curRequest !== dic.lastRequest) {
          // 比最后一次请求晚返回导致dic.resolves已经变为null，但是此时的dic.dicData是最新的
          return dic.resolves ? dic.resolves.push(resolve) : resolve(dic.dicData)
        }
        
        // 请求结束，返回请求数据
        dic.resolves.forEach(resolve => resolve(dicData))
        dic.resolves = null
        dic.lastRequest = null
        
        commit('SET_DIC_DATA', { prop, dicData })
        resolve(dicData)
        dic.loading = false
        return dicData
      })
    },
    // 获取所有字典
    GetAllDic({ state, dispatch }) {
      for (const stateKey in state) {
        requestLimitNum(6)
        requestQueue(() => dispatch('GetDic', stateKey))
      }
    },
    // 清除字典
    ClearDic({ state, commit }, prop) {
      let dic = state[prop]
      if (dic) dic.loading = false
      
      commit('SET_DIC_DATA', {
        prop,
        dicData: null
      })
    },
    // 刷新字典
    async RefreshDic({ state, dispatch }, prop) {
      await dispatch('ClearDic', prop)
      
      let dic = state[prop]
      if (!dic) return []
      dic.loading = false
      
      return await dispatch('GetDic', prop)
    },
    // 当字典无值时，重新获取字典
    GetDicRetry({ state, dispatch }, prop) {
      let dic = state[prop]
      if (!dic) return []
      
      if (validatenull(dic.dicData)) {
        dispatch('ClearDic', prop)
        return dispatch('GetDic', prop)
      }
      return dic.dicData
    },
    // 处理avueCrud/avueForm的option的column，为column子项添加dicData和props
    async HandleOption({ dispatch, state }, { column = [], group, dic } = {}) {
      const p = {}
      dic = validData(dic, {})
      if (column && group) {
        group.forEach((item) => {
          column = column.concat(item.column)
        })
      }
      if (!Array.isArray(column)) return []
      column.forEach((column) => {
        if (!column) return
        
        let dicName = getDicName(column)
        if (state[dicName] && hasDicType.includes(column.type)) {
          if (validatenull(column.dicData) || column.dicOrigin === 'dic') {
            // !column.dicData && (column.dicData = []) // 为了使 column.dicData 变成响应式的：在赋值 this 之前设置一个空数组
            !dic[dicName] && (dic[dicName] = [])
            p[dicName] = dispatch('GetDic', dicName).then((dicData) => {
              // console.log(dicName, dicData)
              if ((validatenull(column.dicData) || column.dicOrigin === 'dic') && dicData) {
                if (column.dicPart) {
                  dicData = state[dicName].partData[column.dicPart]
                }
                
                // column.dicData = dicData
                column.dicOrigin = 'dic' // dicData 是通过 HandleOption 设置的
                
                dic[dicName] = validData(dic[dicName], dicData)
              }
            })
          } else {
            // dicData 是事先设置的，不是通过 HandleOption 设置的
            column.dicOrigin = 'self'
          }
        }
        
        if (column.dicTypes) {
          for (const key in column.dicTypes) {
            const dicType = column.dicTypes[key]
            const [dicName, dicPart] = Array.isArray(dicType) ? dicType : [dicType]
            p[dicName] = dispatch('GetDic', dicName).then((dicData) => {
              if (dicPart) {
                dicData = state[dicName].partData[dicPart]
              }
              
              dic[dicName] = dicData
            })
          }
        }
      })
      await Promise.all(Object.values(p))
      return dic
    }
  }
}

export function dicToCommon(dic, props = {}) {
  if (!Array.isArray(dic) || dic.length === 0) return dic
  let { label = 'label', value = 'value', children = 'children' } = props
  if (label === 'label' && value === 'value' && children === 'children') return dic
  dic.forEach((dicItem) => {
    dicItem.label = $GET(dicItem, label, '')
    dicItem.value =  $GET(dicItem, value, '')
    if (dicItem[children]) {
      let childrenList = dicToCommon(dicItem[children], props)
      dicItem.children = validatenull(childrenList) ? undefined : childrenList
    }
  })
  return dic
}

export function createDic(...args) {
  args = flattenDeep(args)
  const dics = args.map(item => ({
    state: item
  }))
  
  if (!IS_PRODUCTION) {
    // 获取所有 key 值
    const allKeys = flatMap(args, obj => Object.keys(obj))
    // 获取重复 key 值
    const duplicateKeys = chain(allKeys)
      .countBy()
      .pickBy(count => count > 1)
      .keys()
      .value()
    duplicateKeys.length && console.error(`dic中有重复的key（相同key会导致覆盖）：${duplicateKeys.join('、')}`)
    
    // 获取所有属性值
    const allValues = flatMap(args, obj => Object.values(obj))
    // 获取重复属性值
    const duplicateValues = chain(allValues)
      .map('url')
      .filter()
      .map(trim)
      .countBy()
      .pickBy(count => count > 1)
      .keys()
      .value()
    duplicateValues.length && console.error(`dic中有重复的url：${duplicateValues.join('、')}`)
  }
  
  return merge(dic, ...dics)
}

export default dic
