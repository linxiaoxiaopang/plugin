import { REQUEST_ALL_DATA } from '@/utils/constant/requestConst'

// 菜单列表 menuType 0菜单 1按钮 2其它
export const MENU_TYPE_MENU = 0
export const MENU_TYPE_BTN = 1
export const MENU_TYPE_OTHER = 2
export const MENU_TYPES = {
  menu: MENU_TYPE_MENU,
  btn: MENU_TYPE_BTN,
  other: MENU_TYPE_OTHER
}
export function getXMenuType(type = 'other') {
  return {
    'x-menu-type': MENU_TYPES[type]
  }
}

// 客户端类型 0后台端菜单 1业务端菜单  2工厂端菜单 3财务系统 4物流系统 5MES总后台 6对外MES 7对内MES 8仓储前台 9仓储后台
export const CLIENT_TYPE_ADMIN = 0
export const CLIENT_TYPE_BUSINESS = 1
// export const CLIENT_TYPE_FACTORY = 2
export const CLIENT_TYPE_FINANCIAL = 3
export const CLIENT_TYPE_LOGISTICS = 4
export const CLIENT_TYPE_GMES_FACADE = 5
export const CLIENT_TYPE_EMES_FACADE = 6
export const CLIENT_TYPE_IMES_FACADE = 7
export const CLIENT_TYPE_WMS_FACADE = 8
export const CLIENT_TYPE_WMSADMIN_FACADE = 9
export const CLIENT_TYPE_DESIGNBUSINESS = 2
export const MENU_DIC_NAMES = {
  [CLIENT_TYPE_ADMIN]: 'adminMenuList',
  [CLIENT_TYPE_DESIGNBUSINESS]: 'designbusinessMenuList',
  // [CLIENT_TYPE_FACTORY]: 'factoryMenuList'
}

//默认展开的submenu
export const MENU_DEFAULT_OPENEDS = ['/design/index', '/product/private']
//当前平台类型
export const CURRENT_MENU_TYPE = CLIENT_TYPE_DESIGNBUSINESS

export const MENU_DIC = {
  [CLIENT_TYPE_DESIGNBUSINESS]: {
    label: '原创业务端菜单',
    value: CLIENT_TYPE_DESIGNBUSINESS,
    name: 'designbusinessMenuList',
    secret: '4OTeMQ2TBYOTQJ7t',
    requestPrefix: 'designbusiness',
    headers: {
      'x-client-id': 'designbusiness',
      'x-client-type': CLIENT_TYPE_DESIGNBUSINESS
    },
    tokenKey: {
      access: 'x-designbusiness-access-token',
      refresh: 'x-designbusiness-refresh-token'
    }
  },
  [CLIENT_TYPE_ADMIN]: {
    label: '后台端菜单',
    value: CLIENT_TYPE_ADMIN,
    name: 'adminMenuList',
    secret: 'RUMfYULh83N3L8jg',
    requestPrefix: 'admin',
    headers: {
      'x-client-id': 'zdAdmin',
      'x-client-type': CLIENT_TYPE_ADMIN
    },
    tokenKey: {
      access: 'x-admin-access-token',
      refresh: 'x-admin-refresh-token'
    }
  },
  [CLIENT_TYPE_BUSINESS]: {
    label: '业务端菜单',
    value: CLIENT_TYPE_BUSINESS,
    name: 'businessMenuList',
    secret: 'YzB4cE8CPYj7PXFQ',
    requestPrefix: 'business',
    headers: {
      'x-client-id': 'zdBusiness',
      'x-client-type': CLIENT_TYPE_BUSINESS
    },
    tokenKey: {
      access: 'x-business-access-token',
      refresh: 'x-business-refresh-token'
    }
  },
  [CLIENT_TYPE_BUSINESS]: {
    label: '业务端菜单',
    value: CLIENT_TYPE_BUSINESS,
    name: 'businessMenuList',
    secret: 'YzB4cE8CPYj7PXFQ',
    requestPrefix: 'business',
    headers: {
      'x-client-id': 'zdBusiness',
      'x-client-type': CLIENT_TYPE_BUSINESS
    },
    tokenKey: {
      access: 'x-business-access-token',
      refresh: 'x-business-refresh-token'
    }
  },
  // [CLIENT_TYPE_FACTORY]: {
  //   label: '工厂端菜单',
  //   value: CLIENT_TYPE_FACTORY,
  //   name: 'factoryMenuList',
  //   secret: '4OTeMQ2TBYOTQJ7z',
  //   requestPrefix: 'factory',
  //   headers: {
  //     'x-client-id': 'zdFactory',
  //     'x-client-type': CLIENT_TYPE_FACTORY
  //   },
  //   tokenKey: {
  //     access: 'x-factory-access-token',
  //     refresh: 'x-factory-refresh-token'
  //   }
  // },
  [CLIENT_TYPE_FINANCIAL]: {
    label: '财务系统菜单',
    value: CLIENT_TYPE_FINANCIAL,
    name: 'financialMenuList',
    secret: 'RUMfYULh83N3L8jg',
    requestPrefix: 'finance',
    headers: {
      'x-client-id': 'zdFinance',
      'x-client-type': CLIENT_TYPE_FINANCIAL
    },
    tokenKey: {
      access: 'x-finance-access-token',
      refresh: 'x-finance-refresh-token'
    }
  },
  [CLIENT_TYPE_LOGISTICS]: {
    label: '物流系统菜单',
    value: CLIENT_TYPE_LOGISTICS,
    name: 'logisticsMenuList',
    secret: 'RUMfYULh83N3L8jg',
    requestPrefix: 'logistics',
    headers: {
      'x-client-id': 'zdLogistics',
      'x-client-type': CLIENT_TYPE_LOGISTICS
    },
    tokenKey: {
      access: 'x-logistics-access-token',
      refresh: 'x-logistics-refresh-token'
    }
  },
  [CLIENT_TYPE_GMES_FACADE]: {
    label: 'MES总后台菜单',
    value: CLIENT_TYPE_GMES_FACADE,
    name: 'gmesFacadeMenuList',
    secret: '4OTeMQ2TBYOTQJ7t',
    requestPrefix: 'gmes',
    headers: {
      'x-client-id': 'zdGmes',
      'x-client-type': CLIENT_TYPE_GMES_FACADE
    },
    tokenKey: {
      access: 'x-gmes-access-token',
      refresh: 'x-gmes-refresh-token'
    }
  },
  [CLIENT_TYPE_EMES_FACADE]: {
    label: '对外MES菜单',
    value: CLIENT_TYPE_EMES_FACADE,
    name: 'emesFacadeMenuList',
    secret: '4OTeMQ2TBYOTQJ7t',
    requestPrefix: 'emes',
    headers: {
      'x-client-id': 'zdEmes',
      'x-client-type': CLIENT_TYPE_EMES_FACADE
    },
    tokenKey: {
      access: 'x-emes-access-token',
      refresh: 'x-emes-refresh-token'
    }
  },
  [CLIENT_TYPE_IMES_FACADE]: {
    label: '对内MES菜单',
    value: CLIENT_TYPE_IMES_FACADE,
    name: 'imesFacadeMenuList',
    secret: '4OTeMQ2TBYOTQJ7t',
    requestPrefix: 'imes',
    headers: {
      'x-client-id': 'zdImes',
      'x-client-type': CLIENT_TYPE_IMES_FACADE
    },
    tokenKey: {
      access: 'x-imes-access-token',
      refresh: 'x-imes-refresh-token'
    }
  },
  [CLIENT_TYPE_WMS_FACADE]: {
    label: '仓储前台菜单',
    value: CLIENT_TYPE_WMS_FACADE,
    name: 'wmsFacadeMenuList',
    secret: 'RUMfYULh83N3L8jg',
    requestPrefix: 'wms',
    headers: {
      'x-client-id': 'zdWms',
      'x-client-type': CLIENT_TYPE_WMS_FACADE
    },
    tokenKey: {
      access: 'x-wms-access-token',
      refresh: 'x-wms-refresh-token'
    }
  },
  [CLIENT_TYPE_WMSADMIN_FACADE]: {
    label: '仓储后台菜单',
    value: CLIENT_TYPE_WMSADMIN_FACADE,
    name: 'wmsadminFacadeMenuList',
    secret: 'RUMfYULh83N3L8jg',
    requestPrefix: 'wmsadmin',
    headers: {
      'x-client-id': 'zdWmsadmin',
      'x-client-type': CLIENT_TYPE_WMSADMIN_FACADE
    },
    tokenKey: {
      access: 'x-wmsadmin-access-token',
      refresh: 'x-wmsadmin-refresh-token'
    }
  }
}

//获取当前平台的配置
export const CURRENT_CLIENT_CONFIGURE = MENU_DIC[CURRENT_MENU_TYPE]
// 权限前缀
export const PERMISSION_PREFIX = CURRENT_CLIENT_CONFIGURE.requestPrefix
export const GET_PERMISSION_PREFIX = (code) => {
  return new RegExp(`^${PERMISSION_PREFIX}:`).test(code) ? code : `${PERMISSION_PREFIX}:${code.replace(/^:/, '')}`
}

export const REQUEST_PREFIX = CURRENT_CLIENT_CONFIGURE.requestPrefix

//获取请求前缀
export const GET_REQUEST_PREFIX = (url) => {
  return url
  return /^\/?common/.test(url) ? url : `/${REQUEST_PREFIX}/${url.replace(/^\//, '')}`
}

//获取平台类型字典
export function GET_CLIENT_TYPE_DIC() {
  const clientTypeDic = {}
  for (let clientType in MENU_DIC) {
    const prop = MENU_DIC[clientType].name
    //额外新增的MenuList
    const addMenuList = [CLIENT_TYPE_IMES_FACADE, CLIENT_TYPE_EMES_FACADE]
    //默认当前平台
    addMenuList.push(CURRENT_CLIENT_CONFIGURE.value)
    clientTypeDic[prop] = {
      url: GET_REQUEST_PREFIX('common/authService/menu/wmsTreeMenuList'),
      data: {
        clientType,
        ...REQUEST_ALL_DATA
      },
      dicData: null,
      props: {
        label: 'roleName',
        value: 'id'
      }
    }
  }
  return clientTypeDic
}

//根据类型获取数据
export function GET_DIC_BY_TYPE(type = CURRENT_MENU_TYPE) {
  return MENU_DIC[type]
}

