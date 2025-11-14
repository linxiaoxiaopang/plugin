//补充lodash的一些方法
import flatMapDeep from 'lodash/flatMapDeep'
import cloneDeep from 'lodash/cloneDeep'

/**
 * @description: 扁平化tree结构, 默认是扁平化children
 * @param {Array} data
 * @return {Array} 扁平化之后的数组
 */
export function flatTreeMapDeep(data, flatProp = 'children') {
  const fData = flatMapDeep(cloneDeep(data), (n) => {
    return n[flatProp] ? [n, flatTreeMapDeep(n[flatProp])] : n
  })
  return fData
}
