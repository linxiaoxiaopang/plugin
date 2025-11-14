import router from './router'
import store from './store'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // getToken from cookie
import { isUatOrPro, handlePermission } from '@/utils' // getToken from cookie
import { filterAsyncRouter } from './store/modules/permission'
import loginApi from '@/api/system/login'
import superRouter from '@/router/superRouter'

const { buildMenus } = loginApi


// NProgress.configure({ showSpinner: false }) // NProgress Configuration

// const whiteList = ['/','/testLogin', '/login', '/register', '/forgetPassword', '/help/helpCenter','/help/lawCompliance'] // no redirect whitelist
const whiteList = [
  '/',
  '/testLogin',
  '/login',
  '/forgetPassword',
  '/goodsManagement',
  '/goodsManagement/batchActivityDeclaration',
  '/goodsManagement/marketingActivity',
  '/goodsManagement/designTemplate',
  '/intelligentPricing',
  '/intelligentPricing/intelligentPricing',
  '/intelligentPricing/pricingSettings'
] // no redirect whitelist

router.beforeEach((to, from, next) => {
  // NProgress.start() // start progress bar;
  if (getToken()) {
    store.commit('SET_CUR_ROUTER_ID', to.meta.id)
    // 已登录且要跳转的页面是登录页
    if (to.path === '/login') {
      store.dispatch('LogOut')
      next('/')
      // NProgress.done() // if current page is dashboard will not trigger	afterEach hook, so manually handle it
    } else {
      next()
    }
  } else {
    /* has no token*/
    if (whiteList.find(item => to.path.indexOf(item) !== -1) ) {
      // 在免登录白名单，直接进入
      console.log('白名单')
      next()
      // NProgress.done()
    } else {
      next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
      // NProgress.done()
    }
  }
})

router.onError(error => {
  console.log(error)
  const tip = {
    title: '导航错误',
    message: '未能导航到页面。请刷新页面（ctrl+f5或Command+shift+R）\n或者登出并再次登录以重试。',
    confirmButtonText: '刷新页面',
    cancelButtonText: '登出'
  }
  import('vue').then(async ({ default: Vue }) => {
    const isSubmit = await Vue.prototype.$Confirm({
      type: 'error',
      title: tip.title,
      showClose: false,
      message: tip.message,
      confirmButtonText: tip.confirmButtonText,
      closeOnClickModal: false,
      cancelButtonText: tip.cancelButtonText
    })
    if(isSubmit) {
      location.reload()
    } else {
      store.dispatch('LogOut')
    }
    throw new Error(error)
  })
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
