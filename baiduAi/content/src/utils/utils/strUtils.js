// 字符串方法
import fill from 'lodash/fill'
/**
 * @description: 将字符串替换为 指定字符
 * @param {String} oStr
 * @param {Number} startNum
 * @param {Number} cutNum
 * @param {String} chart
 * @return {String}
 */

export function replaceStrToCharacter(startNum, cutNum, chart = '*') {
  return (oStr) => {
    if (!oStr) {
      return ''
    }
    oStr = oStr + ''
    cutNum = typeof cutNum === 'number' ? cutNum : oStr.length - startNum
    startNum = typeof startNum === 'number' ? startNum : 0
    const endNum = cutNum + startNum
    return fill(oStr.split(''), chart, startNum, endNum).join('')
  }
}
