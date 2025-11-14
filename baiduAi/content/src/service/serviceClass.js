/* eslint-disable */
import { Notification } from 'element-ui'
import store from '@/store'
import service from '@/service/request'
import { getToken } from '@/utils/auth'
import { vaildData, validData } from '@/components/avue/utils/util'
import router from '@/router'
import { getDefaultXMenuType, getIP, getUUID } from '@/utils'
import { CURRENT_CLIENT_CONFIGURE } from '@/utils/constant/menuConst'
import { md5 } from '@/utils/md5'
import { IS_PRODUCTION } from '@/utils/constant/systemConst'

const secret = CURRENT_CLIENT_CONFIGURE.secret


let isRefreshing = false
let retryRequests = []

const txt = {
  error: '错误',
  tips: '提示',
  timedOut: '请求超时',
  serverError: '服务器错误',
  reLogin: '重新登录',
  cancel: '取消',
  connectFailed: '无法连接到服务器',
  loginExpired: '登录状态已过期'
}

/**
 * 请求拦截
 * @type {RequestInterceptorsClass}
 */
export const RequestInterceptorsClass = class RequestInterceptorsClass {
  constructor() {
  }

  static getMenuType(config) {
    return vaildData(config.headers['x-menu-type'], getDefaultXMenuType(config.url))
  }

  async requestInterceptorsHandler(config) {
    const headers = this.getSignHeader(config)
    const signStr = this.getSignStr(headers)
    headers['x-sign'] = md5(`${signStr}${secret}`)
    headers['Content-Type'] = 'application/json'
    this.fillToken(headers)
    await this.fillIp(headers)
    Object.assign(config.headers, headers)

    // 提供后端调试使用
    if (!IS_PRODUCTION && window.requestHeaders) {
      let assignHeaders = window.requestHeaders
      try {
        if (typeof assignHeaders === 'object') assignHeaders = JSON.stringify(assignHeaders)
        Object.assign(config.headers, {
          'n-d-region': assignHeaders
        })
      } catch {}
    }

    config.url = this.replaceUrl(config)
    this.changeWebsocketStatus()
    return config
  }

  getSignHeader(config) {
    return {
      ...CURRENT_CLIENT_CONFIGURE.headers,
      // menu_type    菜单类型（0菜单 1按钮 2其它）
      'x-menu-type': RequestInterceptorsClass.getMenuType(config),
      'x-timestamp': `${+new Date()}`,
      'x-nonce': `${getUUID()}`,
      'x-trace-id': `${getUUID().replace(/-/g, '')}`
    }
  }

  getSignStr(headers) {
    // 获取签名
    return Object.keys(headers)
      .sort()
      .reduce((str, key) => `${str}${key}=${headers[key]}`, '')
  }

  fillToken(headers) {
    const token = getToken()
    if (!token) return
    headers['x-access-token'] = token // 让每个请求携带自定义token 请根据实际情况自行修改
    headers['x-refresh-token'] = getToken('refresh')
  }

  async fillIp(headers) {
    const { xIntranetIp, xInternetIp } = await getIP()
    headers['x-intranet-ip'] = xIntranetIp
    headers['x-internet-ip'] = xInternetIp
  }

  replaceUrl(config) {
    return config.url.replace(/\/$/, '').replace(/\/\?/, '?')
  }

  changeWebsocketStatus() {
    this.changeStatus()
    const nowStatus = store.state.user.isLinkWebsocket
    if (!nowStatus) {
      store.commit('WEBSOCKET_STATUS_CHANGE', true)
    }
  }
  changeStatus = this.debounce(() => {
    store.commit('WEBSOCKET_STATUS_CHANGE', false)
  }, 1800000)
  debounce(fn, wait) {
    let timeout = null //定义一个定时器
    return function () {
      if (timeout !== null) clearTimeout(timeout) //清除这个定时器
      timeout = setTimeout(fn, wait)
    }
  }
}


/**
 * 正常拦截
 * @type {InterceptorsClass}
 */
export const InterceptorsClass = class InterceptorsClass {
  constructor() {
  }

  static getStatus(response) {
    return response.status
  }

  static getCode(response) {
    return response.data.code
  }

  static getCodeMessage(response) {
    return response.data.message || txt.error
  }

  static formatResponse(response) {
    response.data.detail = response.data.data
    delete response.data.data
  }

  static handleRefreshToken({ config }) {
    if (!isRefreshing) {
      isRefreshing = true
      return store
        .dispatch('RefreshToken')
        .then(() => {
          // 已经刷新了token，将所有队列中的请求进行重试
          retryRequests.forEach((cb) => cb(getToken()))
          // 重试完清空这个队列
          retryRequests = []
          return service(config)
        })
        .finally(() => {
          isRefreshing = false
        })
    } else {
      // 正在刷新token，返回一个未执行resolve的promise
      return new Promise((resolve) => {
        // 将resolve放进队列，用一个函数形式来保存，等token刷新后直接执行
        retryRequests.push(() => {
          resolve(service(config))
        })
      })
    }
  }

  interceptorsHandler(response) {
    try {
      this.statusSuccessHandler(response)
      this.dealWithBuffer(response)
      if (this.isBlob(response)) return response.data
      InterceptorsClass.formatResponse(response)
      this.codeSuccessHandler(response)
      return response.data
    } catch {
      this.codeErrorHandler(response)
      throw response?.data
    }
  }

  dealWithBuffer(response) {
    const responseType = response.config.responseType
    if(responseType !== 'arraybuffer') return
    const data = response.data
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const blob = new Blob([data], { type: contentType })
    response.data = blob
  }

  statusSuccessHandler(response) {
    const status = InterceptorsClass.getStatus(response)
    if (status >= 200 && status < 300) return true
    throw new Error(response)
  }

  //通过“size”和“type”的key值是否存在判断是否是'blob'类型的数据
  isBlob(response) {
    return response.data.size && response.data.type
  }

  codeSuccessHandler(response) {
    const code = InterceptorsClass.getCode(response)
    if (code == 0 || code >= 200 && code < 300) return true
    throw new Error(response)
  }

  codeErrorHandler(response) {
    const code = InterceptorsClass.getCode(response)
    const errorList = {
      1001009: errorCode1001009,
      default: errorNormal
    }
    const handler = validData(errorList[code], errorList.default)
    handler.call(this, response)

    function errorCode1001009(response) {
      return InterceptorsClass.handleRefreshToken(response)
    }

    function errorNormal(response) {
      const message = InterceptorsClass.getCodeMessage(response)
      Notification({
        type: message ? 'warning' : 'error',
        title: message ? txt.tips : txt.error,
        customClass: 'wrap uiid-zd-responseError',
        message
      })
    }
  }
}

/**
 * 错误拦截
 * @type {ErrorInterceptorsClass}
 */
const ErrorInterceptorsClass = class ErrorInterceptorsClass {
  constructor() {
  }

  getErrStatus(error) {
    const errStatusList = Object.keys(this.errorList(error))
    const len = errStatusList.length
    for (let i = 0; i < len; i++) {
      const errStatus = errStatusList[i]
      const isExist = error.toString().indexOf(errStatus) >= 0
      if (isExist) return errStatus
    }
    return 'default'
  }

  errorInterceptorsHandler(error) {
    console.log('errorerrorerror', error)
    const errStatus = this.getErrStatus(error)
    console.log('errStatus', errStatus)
    const errList = this.errorList()
    console.log('errList', errList)
    errList[errStatus](error)
    throw new Error(error)
  }

  errorList() {
    return {
      500: errStatus500,
      401: errStatus401,
      403: errStatus403,
      502: errStatus502,
      timeout: errStatusTimeout,
      default: errStatusNormal
    }


    function errStatus500() {
      Notification.error({
        title: txt.error,
        message: txt.serverError,
        customClass: 'wrap uiid-zd-responseError'
      })
    }

    function errStatus401() {
      Notification.error({
        title: txt.error,
        message: txt.loginExpired,
        customClass: 'wrap uiid-zd-responseError'
      })
      setTimeout(() => {
        store.dispatch('LogOut')
      }, 1500)
    }

    function errStatus403() {
      router.push({ path: '/401' })
    }

    function errStatus502() {
      Notification.error({
        title: txt.error,
        message: txt.connectFailed,
        customClass: 'wrap uiid-zd-responseError'
      })
    }

    function errStatusTimeout() {
      Notification.error({
        title: txt.error,
        message: txt.timedOut,
        customClass: 'wrap uiid-zd-responseError'
      })
    }

    function errStatusNormal(error) {
      const errorMsg = error?.response?.data?.detail
      if (errorMsg !== undefined) {
        Notification.error({
          title: txt.error,
          message: errorMsg,
          customClass: 'wrap uiid-zd-responseError'
        })
      } else {
        Notification.error({
          title: txt.error,
          message: txt.error,
          customClass: 'wrap uiid-zd-responseError'
        })
      }
    }
  }
}


export const requestInterceptorsClass = new RequestInterceptorsClass()
export const responseErrorInterceptorsClass = new ErrorInterceptorsClass()
export const responseInterceptorsClass = new InterceptorsClass()
