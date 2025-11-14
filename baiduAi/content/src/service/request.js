import axios from 'axios'
import * as Sentry from '@sentry/vue'
import {
  requestInterceptorsClass,
  responseErrorInterceptorsClass,
  responseInterceptorsClass
} from '@/service/serviceClass'

let baseURL = (window.baseURL = process.env.NODE_ENV === 'production' ? '/' : process.env.VUE_APP_BASE_API)
const stage = process.env.VUE_APP_ENV_STAGE
//线上配置
if (stage && stage.search(/prd/i) >= 0) {
  baseURL = window.baseURL = process.env.VUE_APP_BASE_API
}
// 创建axios实例
const service = axios.create({
  baseURL // api 的 base_url
  // timeout: 60000 // 请求超时时间
})
let temuPort = 3000
//在客户端打开页面时，由客户端分配端口，跟客户端交互
const documentTitle = document.title
if (window.electronAPI) {
  window.electronAPI.invoke('data:get:store').then(res => {
    const port = res?.user?.port
    if(!port) return
    document.title = res?.user?.userInfo?.mallList?.[0]?.mallName || documentTitle
    temuPort = port
  })
}

// request拦截器
service.interceptors.request.use(
  async (config) => {
    // 根据请求url动态设置baseURL
    if (config.url && config.url.startsWith('/temu-agentseller')) {
      config.baseURL = `http://localhost:${temuPort}/`
    }

    return await requestInterceptorsClass.requestInterceptorsHandler(config)
  },
  (error) => {
    // Do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  (response) => {
    const { code } = $GET(response, 'data', {})
    const valid = code == 0 || (code >= 200 && code < 300)
    if (!valid) Sentry.captureException({ ...response.data, traceId: response.config.headers['x-trace-id'] })
    return responseInterceptorsClass.interceptorsHandler(response)
  },
  (error) => {
    const data = $GET(error, 'response.data', {})
    Sentry.captureException(data)
    return responseErrorInterceptorsClass.errorInterceptorsHandler(data)
  }
)

export default service
