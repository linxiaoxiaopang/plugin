import Vue from 'vue'
import 'normalize.css/normalize.css' // A modern alternative to CSS resets
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/zh-CN' // lang i18n
import '@/styles/theme/index.css' // global css
import '@/styles/index.scss' // global css
import 'font-awesome/css/font-awesome.min.css'
import moment from 'moment' //导入文件
//重写fabric 方法
import VueWorker from 'vue-worker'

//vue-awesome-swiper滚动插件
import VueAwesomeSwiper from 'vue-awesome-swiper'
import 'swiper/css/swiper.css'

import App from './App'
import router from './router'
import store from './store'


import baseComponents from '@/commons/baseComponents'
import globalConst from '@/commons/globalConst'
import commonElementUi from '@/commons/commonElementUi'
import filters from '@/filters' // global filters
import directive from '@/directive' // global directive
import extend from '@/extend' // global extend
import config from '@/service/config'

import '@/components'
import '@/views/components'
import '@/sentry'

Vue.prototype.$serverRootPath = config.baseURL
Vue.prototype.$moment = moment //赋值使用
Vue.prototype.$bus = new Vue()

moment.locale('zh-cn')
moment.relativeTimeThreshold('h', 24) // 设置新的阈值 - 一天最少小时数

const container = document.createElement('div')
container.style.cssText = 'position:fixed; top:20px; left:20px; background:green; color:white; padding:10px;'
const app = document.createElement('div')
app.id = 'vue-app'
document.body.appendChild(container)
container.appendChild(app)

Vue.use(ElementUI, { locale })
  .use(baseComponents)
  .use(globalConst)
  .use(commonElementUi)
  .use(filters)
  .use(directive)
  .use(extend)
  .use(VueAwesomeSwiper)
  .use(VueWorker)
Vue.config.productionTip = false
new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#vue-app')
