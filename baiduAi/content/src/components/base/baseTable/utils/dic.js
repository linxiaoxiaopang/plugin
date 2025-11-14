/* eslint-disable */
import { apiFactory, REQUEST_ALL_DATA } from '@/utils/constant'
import { find } from 'lodash'
import Vue from 'vue'
import { isNumber } from '@/components/avue/utils/validate.js'

const dicApi = {
  // warehouseList: {
  //   dicApi: 'orderService/order/selectLegalEditWarehouse',
  //   props: {
  //     label: 'warehouseName',
  //     value: 'warehouseId'
  //   }
  // }
}

for (const dicApiKey in dicApi) {
  dicApi[dicApiKey].dicApi = apiFactory(dicApi[dicApiKey].dicApi)
}

export async function getDic(dicName, data) {
  let { dicApi: api, props } = dicApi[dicName]
  let dicData = await awaitResolveDetail(
    api({
      ...data,
      ...REQUEST_ALL_DATA
    })
  )
  return (Array.isArray(dicData) ? dicData : []).map(item => {
    item.label = item[props.label]
    item.value = item[props.value]
    return item
  })
}

export function setDicOnColumn(column, option, postData) {
  for (const prop in option) {
    let curColumn = find(column, { prop })
    if (!curColumn) continue

    let curOption = option[prop]
    let { dicName, data = postData } = typeof curOption === 'string' ? { dicName: curOption } : curOption
    Vue.set(curColumn, 'dicApi', getDic.bind(this, dicName, data))
  }
}

export function getDicByObj(obj, type = 'auto') {
  const valueHandler = {
    auto: (key) => isNumber(key) ? Number(key) : key,
    number: (key) => Number(key)
  }[type]
  
  const tmpArr = []
  for (let key in obj) {
    tmpArr.push({
      label: obj[key],
      value: valueHandler(key)
    })
  }
  return tmpArr
}

export default dicApi
