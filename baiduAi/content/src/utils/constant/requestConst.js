/* eslint-disable */
import request from '@/service/request'
import { GET_REQUEST_PREFIX, getXMenuType } from '@/utils/constant/menuConst'
import {forOwn, isObject} from 'lodash'

export const REQUEST_ALL_DATA = {
  page: {
    pageIndex: 1,
    pageSize: 0
  }
}
export function apiFactory(option) {
  typeof option === 'string' && (option = { url: option })
  option.url = GET_REQUEST_PREFIX(option.url)
  function api(data, menuType = option.menuType) {
    const isFormData = option.dataType == 'FormData'
    let finishData = {
      ...option.mergeData,
      ...data
    }
    if (isFormData) {
      finishData = objectToFormData(finishData)
    }
    return request({
      headers: menuType ? getXMenuType(menuType) : menuType,
      url: option.url,
      method: option.method || 'post',
      responseType: option.responseType,
      data: finishData
    })
  }

  return option.dicName
    ? function (...args) {
      return refreshDic(api(...args), option.dicName)
    }
    : api
}

export function createApi(option, awaitOption) {
  for (const key in option) {
    option[key] = apiFactory(option[key], awaitOption)
  }
  return option
}

export function objectToFormData(obj, form, namespace) {
  const formData = form || new FormData()

  forOwn(obj, (value, key) => {
    const formKey = namespace ? `${namespace}[${key}]` : key

    if (isObject(value) && !(value instanceof File || value instanceof Blob)) {
      // 如果是对象（但不是File），递归处理
      objectToFormData(value, formData, formKey)
    } else if(value instanceof File || value instanceof Blob) {
      formData.append(formKey, value, value.name)
    } else {
      // 否则直接添加到FormData
      formData.append(formKey, value)
    }
  })

  return formData
}
