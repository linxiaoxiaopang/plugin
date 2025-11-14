import Cookies from 'js-cookie'
import { CURRENT_CLIENT_CONFIGURE } from '@/utils/constant/menuConst'

const TokenKey = CURRENT_CLIENT_CONFIGURE.tokenKey
const ExpiresTime = 'expiresTime'
const DirExpiresTime = 100 * 60 * 60 * 24
export function getToken(type = 'access') {
  return Cookies.get(TokenKey[type])
}

export function getTokenExpiresTime() {
  return Cookies.get(ExpiresTime)
}

export function setToken(token, rememberMe, expires = 1, type = 'access') {
  if (rememberMe) {
    return Cookies.set(TokenKey[type], token, { expires })
  } else return Cookies.set(TokenKey[type], token)
}

export function setTokenExpiresTime(expiresTime, rememberMe, expires = 1) {
  if (rememberMe) {
    return Cookies.set(ExpiresTime, expiresTime, { expires })
  } else return Cookies.set(ExpiresTime, expiresTime, { expires: -1 })
}

export function removeToken(type = 'access') {
  const domain = process.env.VUE_APP_TOP_DOMAIN
  Cookies.remove(TokenKey[type], { domain })
  return Cookies.remove(TokenKey[type])
}

export function removeTokenExpiresTime() {
  return Cookies.remove(ExpiresTime)
}
