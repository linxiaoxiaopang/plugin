import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)


const routerMap = []

export const constantRouterMap = [...routerMap]

export default new Router({
  mode: 'hash',
  scrollBehavior: () => ({ y: 0 }),
  routes: [...constantRouterMap]
})
