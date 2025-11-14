import dic from '@/store/modules/dic'
import store from '@/store/index'

const getters = {
  devicePixelRatio: (state) => state.window.windowData.devicePixelRatio,
  setting: (state) => state.setting,

  sidebar: (state) => state.app.sidebar,
  device: (state) => state.app.device,
  token: (state) => state.user.token,
  baidu_access_token:(state)=>state.user.baidu_access_token,
  avatar: (state) => state.user.avatar,
  visitedViews: (state) => state.tagsView.visitedViews,
  cachedViews: (state) => state.tagsView.cachedViews,
  id: (state) => state.user.id,
  name: (state) => state.user.name,
  nickName:(state) => state.user.nickName,
  company: (state) => state.user.company,
  childUser: (state) => state.user.childUser,
  createTime: (state) => state.user.createTime,
  email: (state) => state.user.email,
  mobile: (state) => state.user.mobile,
  roles: (state) => state.user.roles,
  britain_duty_paragraph: (state) => state.user.britain_duty_paragraph,
  ioss_duty_paragraph: (state) => state.user.ioss_duty_paragraph,
  //是否是超级管理员
  is_super: (state) => state.user.is_super,
  generateTaskData: (state) => state.user.generateTaskData,
  backgroundTask: (state) => state.user.backgroundTask,
  isAdmin: (state) => state.user.isAdmin,
  isMain: (state) => state.user.isMain,
  isNewType: (state) => state.user.isNewType,
  isCanPay: (state) => state.user.isCanPay,
  isPayOrder: (state) => state.user.isPayOrder,
  isFirstLogin: (state) => state.user.isFirstLogin,
  type: (state) => state.user.type,
  isAuth: (state) => state.user.isAuth, //是否进行认证
  isNeedCheckTransactionPassword: (state) => state.user.isNeedCheckTransactionPassword, //是否设置交易密码
  isSkipReferenceRecord: (state) => state.user.isSkipReferenceRecord, //是否跳过引导
  permission_routers: (state) => state.permission.routers,
  curRouterId: (state) => {
    if (state.permission.curRouterId) {
      let curRouterId = sessionStorage.getItem('curRouterId')
      if (curRouterId) {
        state.permission.curRouterId = curRouterId
      }
    }
    return state.permission.curRouterId
  },
  curRouterPid: (state) => {
    if (state.permission.curRouterPid) {
      if (sessionStorage.getItem('curRouterPid')) {
        state.permission.curRouterPid = sessionStorage.getItem('curRouterPid')
      }
    }
    return state.permission.curRouterPid
  },
  addRouters: (state) => state.permission.addRouters,
  socketApi: (state) => state.api.socketApi,
  //product
  tasks: (state) => {
    return state.product.tasks
  }
}

for (const dicKey in dic.state) {
  getters[dicKey] = (state) => {
    store.dispatch('GetDic', dicKey)
    let { dicData } = state.dic[dicKey]
    return Array.isArray(dicData) ? dicData : []
  }
  getters[`${dicKey}Props`] = (state) => {
    return (
      state.dic[dicKey].props || {
        label: 'label',
        value: 'value'
      }
    )
  }
}

export default getters
