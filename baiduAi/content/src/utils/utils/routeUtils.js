//返回格式化的路由列表
//layout 布局常量
import store from '@/store'
import cloneDeep from 'lodash/cloneDeep'

//展示路由列表
export const ROUTER_MAP_LIST = {
  '/goodsManagement': [
    {
      title: '商品管理',
      matchRouteList: [
        {
          path: '/goodsManagement',
          isMenuItem: true //默认一级是submenu
        }
      ]
    }
  ],
  '/intelligentPricing': [
    {
      title: '智能核价',
      matchRouteList: [
        {
          path: '/intelligentPricing',
          isMenuItem: true //默认一级是submenu
        }
      ]
    }
  ]
}

/**
 * @description: 获取格式化路由列表
 * @param {*}
 * @return {*}
 */
export const getMenuRouterList = () => {
  console.time('log')
  const { min } = Math

  const routerMapList = formatRouterMapList()
  for (let key in routerMapList) {
    const routeArr = routerMapList[key]
    const len = routeArr.length
    for (let i = len - 1; i >= 0; i--) {
      const route = routeArr[i]
      const [isFind, matchData] = findRoute(route)
      if (!isFind && !route.list.length) {
        routeArr.splice(i, 1)
      }
      if (isFind) {
        route.list.sort((a, b) => a.sort - b.sort)
        route.sort = min(...matchData.map(({ sort }) => +sort || 0))
      }
    }
    if (!routeArr.length) {
      delete routerMapList[key]
    }
  }
  console.timeEnd('log')
  return routerMapList
}

/**
 * @description: 根据当前父亲id，获取相关联的父亲id列表
 * @param {String} pid
 * @return {Array} pid列表
 */
export function getConcatPidList(pid) {
  const routerMapList = getMenuRouterList()
  for (let key in routerMapList) {
    const routeArr = routerMapList[key]
    const len = routeArr.length
    for (let i = len - 1; i >= 0; i--) {
      const { pIdList = [] } = routeArr[i]
      if (pIdList.find((findId) => findId == pid)) {
        return routerMapList[key]
      }
    }
  }
  return []
}

/**
 * @description: 查找顶部导航栏路由
 * @param {*} route
 * @return {Array} [Boolean, resData]
 */
function findRoute(route) {
  const permissionRouters = store.getters.permission_routers
  if (!route.matchRouteList) {
    throw Error('matchRouteList不能为空')
  }
  if (!Array.isArray(route.matchRouteList)) {
    route.matchRouteList = [route.matchRouteList]
  }
  if (!route.list) {
    route.list = []
  }
  const { matchRouteList } = route
  const resData = matchRouteList.map((mapRoute) => {
    const findItem = permissionRouters.find((item) => {
      const { path, hidden } = item
      return mapRoute.path == path && !hidden
    })
    if (findItem) {
      findItem.children = findItem.children || []

      filterChild(findItem.children, ({ item }) => {
        return !item.hidden
      })
      const { component, children, ...rest } = findItem
      findItem.children.map((child) => {
        child.parent = {
          ...rest
        }
        route.pIdList || (route.pIdList = [])
        if (!route.pIdList.includes(rest.id)) {
          route.pIdList.push(rest.id)
        }
      })
      route.list.push(...findItem.children)
    }
    return findItem
  })

  return [resData.some(Boolean), resData.filter(Boolean)]
}

/**
 * @description: 筛选删除callback返回false的数据
 * @param {Array} list 待筛选列表
 * @param {Funcation} callback 筛选条件
 * @return {Array} 筛选结束列表
 */
export function filterChild(list, callback) {
  if (!list) {
    throw Error('list 必填')
  }
  if (!Array.isArray(list)) {
    list = [list]
  }
  if (!callback) {
    throw Error('callback 必填')
  }
  const len = list.length
  for (let i = len - 1; i >= 0; i--) {
    const item = list[i]
    if (item.children && item.children.length) {
      filterChild(item.children, callback)
    }
    if (!callback({ list, item })) {
      list.splice(i, 1)
    }
  }
  return list
}

/**
 * @description: 格式化配置路由列表
 * @param {*}
 * @return {Object} 格式完成之后的路由列表
 * 格式化未完成之后，子项的数据结构
 *  '/personalCenter': [
    {
      title: '个人中心',
      hidden: true,
      matchRouteList: [
        {
          path: '/personalCenter',
          isMenuItem: true //默认一级是submenu
        }
      ]
    }
  ]
 */
function formatRouterMapList() {
  const routerMapList = cloneDeep(ROUTER_MAP_LIST)
  for (let key in routerMapList) {
    const list = routerMapList[key]
    list.map((item) => {
      if (!item.matchRouteList) {
        item.matchRouteList = [key]
      }
      const matchRouteList = item.matchRouteList
      matchRouteList.map((sItem, mIndex) => {
        if (typeof sItem === 'string') {
          matchRouteList[mIndex] = ceeateDefaultOptions(sItem)
        }
      })
    })
  }
  return routerMapList
}

/**
 * @description: 创建默认值
 * @param {String} path
 * @return {*}
 */
function ceeateDefaultOptions(path) {
  return {
    path,
    isMenuItem: false,
    hidden: false
  }
}
