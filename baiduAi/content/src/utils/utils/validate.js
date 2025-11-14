/* eslint-disable */
import { Message } from 'element-ui'
import { cloneDeep } from 'lodash'

export async function showMessage({ isMsg = true, empty }, rules, data) {
  const p = handleDataRules(rules, data)
  if (!isMsg) return p
  try {
    const res = await p
    const { rightData } = res
    !rightData.length && Message.warning(empty || '所有数据校验不通过')
  } catch (e) {
    if (e !== false) Message.warning(e)
  }
  return p
}
export function handleDataRules(rules, data) {
  if (!Array.isArray(data)) return
  rules = cloneDeep(rules)
  
  return new Promise(async (resolve, reject) => {
    const mustRules = [] // isMust规则必须全部满足，否则直接报错
    const normalRules = []
    rules.forEach((rule) => {
      (rule.isMust ? mustRules : normalRules).push(rule)
      if (typeof rule.getAsyncData === 'function') rule.getAsyncData = rule.getAsyncData(data)
    })
    
    const p = data.map(async (item, index) => {
      const mustP = mustRules.map(rule => handleRule(rule, item, { data, index }))
      try {
        await Promise.all(mustP)
      } catch (err) {
        reject(err)
        throw err
      }
      
      for (const rule of normalRules) {
        try {
          await handleRule(rule, item, { data, index })
        } catch (err) {
          return err
        }
      }
      return true
    })
    
    let valids
    try {
      valids = await Promise.all(p)
    } catch (err) {
      return
    }
    
    const rightData = []
    const failData = []
    data.forEach((item, index) => {
      (valids[index] === true ? rightData : failData).push(item)
    })
    resolve({
      valids,
      rightData,
      failData
    })
  })
}
export function handleRule(rule, value, data) {
  return new Promise(async (resolve, reject) => {
    const { validator } = rule
    if (validator) {
      validator(
        rule,
        value,
        (msg = true) => {
          if (isErrMsg(msg)) reject(msg)
          resolve(msg)
        },
        data
      )
    }
  })
}
export function isErrMsg(msg) {
  return msg === false || typeof msg === 'string'
}