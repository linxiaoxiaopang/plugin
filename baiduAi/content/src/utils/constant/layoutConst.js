

export const HIDE_LEFT_MENU = 0 //隐藏左边框
export const SHOW_SIDEBAR = 1 //显示路由 sidebar
export const SHOW_PROCATE = 2 //显示分类
export const SHOW_PRIVAT_ECATE = 3 //显示分类类型1
export const SHOW_NEW_PRO_CATE = 4 //显示分类类型2

//layout 布局对象
export const LAYOUT_OPTIONS = {
  hideLayoutHeaderRouteList: ['/design/designContainer'], //隐藏头部
  hideMainContainerClassList: ['/design/designContainer'], //隐藏mainContainer 样式
  hideBottomList: ['/customFloorDesign/editCustomFloorDesign'], //隐藏底部
  appMainContainerClassList: {
    //包裹器样式
    'main-container': [],
    'main-container_1': ['/design/detail', '/message/center', '/notice/center'],
    'main-container_2': ['/design/designContainer', '/customFloorDesign/editCustomFloorDesign']
  },
  //侧边栏类型
  sidebarTypeList: {
    [HIDE_LEFT_MENU]: ['/design/designContainer', '/batchDesign/batchDesignContainer', '/design/detail', '/message/center', '/notice/center', '/customFloorDesign/editCustomFloorDesign'], //隐藏mainContainer 样式
    [SHOW_SIDEBAR]: [], //默认侧边栏
    [SHOW_PROCATE]: [],
    [SHOW_PRIVAT_ECATE]: [],
    [SHOW_NEW_PRO_CATE]: []
  }
}
