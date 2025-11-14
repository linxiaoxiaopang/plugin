import store from '@/store'
import {
  MENU_TYPE_MENU,
  MENU_TYPE_BTN,
  MENU_TYPE_OTHER,
  CURRENT_MENU_TYPE,
  GET_PERMISSION_PREFIX
} from '@/utils/constant'
import { validatenull } from '@/components/avue/utils/validate'
import { uniqueArray } from '@/utils/common'

/**
 * 检查用户是否拥有权限
 * @param {Array|String} value
 * @param {String} type
 * @returns {Boolean}
 */
export function checkPermission(value, type = 'some') {
  if (validatenull(value)) return false
  
  const roles = store.getters && store.getters.roles
  if (roles.includes('admin')) return true
  
  value = Array.isArray(value) ? value : [value]
  return value[type]((role) => {
    return roles.includes(GET_PERMISSION_PREFIX(role))
  })
}

export function getDefaultXMenuType(url) {
  let cachedMenuTypes = store.state.tagsView.cachedMenuTypes
  let currentPath = store.state.tagsView.currentView.path
  if (!cachedMenuTypes[url]) cachedMenuTypes[url] = {}
  if (cachedMenuTypes[url][currentPath]) return cachedMenuTypes[url][currentPath]
  
  let menuTypes = store.state.tagsView.menuTypeOfPath[url] || {}
  // console.log(menuTypes)
  let defaultMenuTypes
  let currentMenuTypes
  for (const menuTypesKey in menuTypes) {
    defaultMenuTypes = menuTypes[menuTypesKey]
    if (new RegExp(`${menuTypesKey}$`).test(currentPath)) {
      currentMenuTypes = menuTypes[menuTypesKey]
      break
    }
  }
  if (!currentMenuTypes) currentMenuTypes = menuTypes.$default
  if (!currentMenuTypes) currentMenuTypes = defaultMenuTypes
  
  let menuType = currentMenuTypes?.[0]?.menuType
  cachedMenuTypes[url][currentPath] = menuType
  return validatenull(menuType) ? MENU_TYPE_BTN : menuType
}

/**
 * 检查用户是否拥有权限
 * @param {Array} data
 * @param {Object} option
 * @returns {Object}
 */
export function handlePermission(
  data,
  {
    menuTypeOfPath = {},
    pFinalRouteWrapper
  } = {}
) {
  let { isMain } = store.getters
  
  let routes = []
  let roles = []
  data
    .sort((a, b) => a.sortNumber - b.sortNumber)
    .forEach(item => {
      item.remarkList = (item.remark || '').split(';').filter(Boolean)
      if (item.clientType !== CURRENT_MENU_TYPE) return
      // 防止同级finalRouteWrapper污染：
      // finalRouteWrapper为handlePermission变量，在重新赋值时会导致未重新赋值的获取最近同级的finalRouteWrapper
      let finalRouteWrapper = pFinalRouteWrapper
      // 下级获取上级的finalRouteWrapper，上级无法获取下级的finalRouteWrapper
      if (isMenuRoute(item)) {
        finalRouteWrapper = {
          finalRoute: item
        }
      }
      if (item.requestUrlRegexp) {
        let requestUrlRegexp = item.requestUrlRegexp
        if (!menuTypeOfPath[requestUrlRegexp]) menuTypeOfPath[requestUrlRegexp] = []
        let menuTypeItem = {
          ...item,
          finalRouteWrapper
        }
        if (item.menuType === MENU_TYPE_OTHER) {
          menuTypeOfPath[requestUrlRegexp].unshift(menuTypeItem)
        } else {
          menuTypeOfPath[requestUrlRegexp].push(menuTypeItem)
        }
      }
  
      const onlyMain = item.remarkList.includes('onlyMain')
      if (item.permissionCode) {
        if (onlyMain && !isMain) return
        roles.push(item.permissionCode)
      }
      
      let $isAuthRoute = isAuthRoute(item) // 放在item.children重新赋值之前执行，因为tabs页面菜单会被过滤
      if (!validatenull(item.children)) {
        item.hasChildren = true
        let permission = handlePermission(
          item.children,
          {
            menuTypeOfPath,
            finalRouteWrapper
          }
        )
        item.children = permission.routes
        roles = roles.concat(permission.roles)
      }
      if (isActiveRoute(item)) {
        item.routePath && routes.push({
          ...item,
          // 路由children无值，无法显示
          children: item.children || [],
          name: item.routePath,
          pid: item.parentId,
          path: item.routePath,
          component: item.componentPath,
          hidden: item.isShow === 0,
          sort: item.sortNumber,
          meta: {
            id: item.id,
            title: item.menuName,
            icon: item.iconCode,
            hasTabs: item.remarkList.includes('hasTabs'),
            onlyChild: item.remarkList.includes('onlyChild'),
            onlyMain,
            isPayOrder: item.remarkList.includes('isPayOrder'),
            isAuthRoute: $isAuthRoute,
            remark: item.remark
          }
        })
      }
    })
  return {
    routes,
    menuTypeOfPath,
    roles: uniqueArray(roles)
  }
}
// 是否被允许的菜单路由
export function isAuthRoute(item) {
  if (item.remarkList.includes('hasTabs')) {
    if (
      !(
        Array.isArray(item.children) &&
        item.children.some(child => {
          return child.menuType === MENU_TYPE_MENU && child.isShow === 1
        })
      )
    ) {
      return false
    }
  }
  return isShowRoute(item)
}
// 显示的菜单路由
export function isMenuRoute(item) {
  return item.isShow === 1 && isActiveRoute(item)
}
// 正常菜单状态的菜单路由
export function isActiveRoute(item) {
  return item.menuStatus === 1 && isRoute(item)
}
// 显示的菜单路由
export function isShowRoute(item) {
  return item.isShow === 1 && isRoute(item)
}
// 菜单路由
export function isRoute(item) {
  let { menuType, componentPath, routePath } = item
  return menuType === MENU_TYPE_MENU && !!componentPath && !!routePath
}

const separator = ';'
export function getRemark(row) {
  let { remark } = row
  let data = remark.split(separator)
  data.forEach(item => {
    if (item.includes('childIds=')) {
      row.childIds = JSON.parse(item.replace('childIds=', '') || '[]')
    }
  })
  return data.filter(item => item && !item.includes('childIds=')).join(separator)
}