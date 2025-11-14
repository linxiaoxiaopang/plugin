import request from '@/service/request'
import { getXMenuType } from '@/utils/constant/menuConst'

export function initData(url, method = 'get', data = {}, menuType = 'menu') {
  const o = {
    url: url.replace(/\/$/, '').replace(/\/\?/, '?'),
    method,
    headers: getXMenuType(menuType)
  }
  if (method.toUpperCase() === 'GET') {
    o.params = data
  }
  if (method.toUpperCase() === 'POST') {
    o.data = data
  }
  return request(o)
}
