/* eslint-disable */
import { isEqualComplex } from '@/utils/functional/isEqual'

export class CustomMap {
  constructor() {}
  map = []
  set = (key, value) => {
    this.map.push({ key, value })
    return value
  }
  get = (key) => {
    return this.map.find((item) => isEqualComplex(item.key, key))?.value
  }
  has = (key) => {
    return !!this.map.find((item) => isEqualComplex(item.key, key))
  }
  clear = (key) => {
    const index = this.map.findIndex((item) => isEqualComplex(item.key, key))?.value
    this.map.splice(index, 1)
  }
  clearAll = () => {
    this.map = []
  }
}