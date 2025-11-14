/* eslint-disable */
import Vue from 'vue'
import axios from 'axios'
import { httpGet, httpPost } from './utils/util.js'
import './theme-chalk/src/common.scss'
import avueCrudFileUpload from '@/components/fileUpload/fileUploadBtn'
const addComponents = [
  avueCrudFileUpload
]

const components = {}
const requireComponent = require.context(
  // 其组件目录的相对路径
  './',
  // 是否查询其子目录
  true,
  // 匹配基础组件文件名的正则表达式
  // /Base[A-Z]\w+\.(vue|js)$/
  /\.vue$/
)
requireComponent.keys().forEach(fileName => {
  // 获取组件配置
  const component = requireComponent(fileName)?.default
  if (!component?.name) return
  component.install = function (Vue) {
    Vue.component(component.name, component)
  }
  components[component.name] = component
})
// console.log(requireComponent.keys())
// console.log(components)

const install = function (Vue, axios, opts = {}) {
  const AVUE = {
    clientHeight: document.documentElement.clientHeight
  }
  for (const componentName in components) {
    Vue.component(componentName, components[componentName])
  }
  addComponents.forEach(component => {
    Vue.component(component.name, component)
  })
  
  AVUE.size = opts.size || ''
  Vue.prototype.$AVUE = AVUE
}

if (typeof window !== 'undefined' && Vue && axios) {
  // install(window.Vue, window.axios);
  //注入axios;
  Vue.prototype.$http = axios
  Vue.prototype.$httpGet = httpGet(axios.get)
  Vue.prototype.$httpPost = httpPost(axios.post)
}
export default {
  version: '1.4.2',
  install,
  ...components
}
