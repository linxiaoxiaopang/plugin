import moment from 'moment'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  getItem({ key, storageType = 'localStorage', type = 'string' }) {
    let value = window[storageType].getItem(key)
    
    if (type !== 'string' && value) {
      try {
        value = value && JSON.parse(value)
      } catch (e) {
        value = null
      }
    }
    if (value) {
      try {
        if (value.$isExpire) {
          for (const expireTime in value) {
            if (expireTime === '$isExpire') continue
            if (validatenull(value[expireTime]) || moment(expireTime).diff(moment(), 's') <= 0) {
              delete value[expireTime]
            }
          }
        }
      } catch (e) {}
    }
  
    return value
  },
  setItem(key, value, storageType = 'localStorage') {
    try {
      window[storageType].setItem(key, JSON.stringify(value))
    } catch (e) {}
  },
  getObjItemExpire(key, storageType = 'localStorage') {
    let value = this.getItem({ key, storageType, type: 'object' })
  
    let tempObj = { $isExpire: true }
    for (const expireTime in value) {
      if (expireTime === '$isExpire') continue
      for (const key in value[expireTime]) {
        tempObj[key] = {
          value: value[expireTime][key],
          expireTime: expireTime
        }
      }
    }
    
    this.setObjItemExpire(key, tempObj, storageType)
    return tempObj
  },
  setObjItemExpire(key, obj, storageType = 'localStorage') {
    let tempObj = { $isExpire: true }
    for (const key in obj) {
      if (key === '$isExpire') continue
      
      let { value, expireTime } = obj[key]
      
      if (!tempObj[expireTime]) tempObj[expireTime] = {}
      tempObj[expireTime][key] = value
    }
    try {
      window[storageType].setItem(key, JSON.stringify(tempObj))
    } catch (e) {}
  }
}