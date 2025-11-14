import { isPlainObject, isNumber, flatten } from 'lodash'
//[{a: [b]}, {c: [d], e: [f]}] [[{a: []}], []]
/**
 * @description: 创建row 合并
 * @param {*} row table row
 * @param {*} column table  column
 * @param {*} rowIndex table rowIndex
 * @param {Array} data 列表页渲染的数据
 * @param {Object} option {
 *  props： [
    [
      { id: ['combinedInfo', 'createByName', 'createTime', 'done'] },
      { combinedColorName: ['combinedColorName'] }]
    ]
  ]
    二维数组 描述row property 中之间的映射关系

  closSpan:{
    combinedInfo: 5 //重置对应键值合并的clo
  }

 * }
 * @return {Array} span 合并的数组
 */

//示例
/** createSpanMethod(
 { row, column, rowIndex },
 this.finalData,
 {
  props: [
    [{ id: ['combinedInfo', 'createByName', 'createTime', 'done'] }, { combinedColorName: ['combinedColorName'] }]
  ],
  closSpan:{
    combinedInfo: 5
  }
})
 **/
export function createSpanMethod({ row, column, rowIndex, columnIndex }, data = [], option) {
  const { props = [], emptyProp = 'done', closSpan = {} } = option
  let { property = 'done' } = column
  if (!property) property = emptyProp
  //当存在头部的情况
  if (row.isHeader) return dealWithIsHeaderProps(row, columnIndex)
  //获取要合并的propert映射的筛选条件
  const filterProps = getMappingFilterProp(property, props)
  //未匹配，表示未合并的单元格
  if (!filterProps.length) return [1, 1]
  //将符合筛选条件的连续数据分组
  const splitData = getSplitData(data, row, filterProps)
  //获取到要合并的条数
  const mergeCount = getMergeCount(splitData, rowIndex)
  let cloCount = 1
  //重置column方向合并的条数
  if (isPlainObject(closSpan) && isNumber(closSpan[property])) cloCount = closSpan[property]
  return [mergeCount, cloCount]
}

export function dealWithIsHeaderProps(row, columnIndex) {
  if (row.isHeader) {
    if (columnIndex == 0) {
      return [1, 1]
    }
    if (columnIndex == 1) {
      return [1, 10]
    }
    return [0, 0]
  }
}

/**
 * @description: 获取筛选条件
 * @param {String} property
 * @param {Array} props 二维数组 筛选所有属性的交集
 * @return {Array}
 */

export function getMappingFilterProp(property, props) {
  let filterProps = []
  ;(() => {
    const len = props.length
    for (let i = 0; i < len; i++) {
      let curListIsFind = false
      let arr = props[i]
      const len1 = arr.length
      for (let j = 0; j < len1; j++) {
        let item = arr[j]
        const isFind = flatten(Object.values(item)).includes(property)
        if (!isFind) filterProps.push(...Object.keys(item))
        if (isFind) {
          curListIsFind = true
          for (let key in item) {
            if (item[key].includes(property)) return filterProps.push(key)
          }
        }
      }
      filterProps = []
    }
  })()
  return filterProps
}

/**
 * @description: 按照索引值拆分数组
 * @param {Array} data 列表数据
 * @param {Object} row
 * @param {Array} filterProps 筛选列表
 * @return {Array}
 */
export function getSplitData(data, row, filterProps) {
  let preIndex = -1
  let splitData = []
  data.map((item, index) => {
    const isSame = filterProps.every((prop) => {
      const originValue = $GET(item, prop, null)
      const currentValue = $GET(row, prop, null)
      if (!originValue || !currentValue) return false
      return originValue == currentValue
    })
    if (!isSame) return
    if (preIndex == -1 || preIndex != index - 1) {
      splitData.push([])
    }
    preIndex = index
    splitData.slice(-1)[0].push(index)
  })
  return splitData
}

/**
 * @description: 获取row合并的数值
 * @param {Array} splitData
 * @param {Number} rowIndex
 * @return {Number}
 */
export function getMergeCount(splitData, rowIndex) {
  const findData = splitData.find((indexData) => indexData.includes(rowIndex))
  if (!findData) return 1
  if (findData[0] == rowIndex) return findData.length
  return 0
}

//获取合并的等级
export function getSpanLevel(col, spanLevelList) {
  //当col的property为空时, property = 'done'为最后一列
  const { property = 'done' } = col
  for (let level in spanLevelList) {
    const arr = spanLevelList[level]
    if (arr.includes(property)) {
      return level
    }
  }
  return null
}

export function getSpanMethod({ row, column, spanLevelList }) {
  const { $spanLevelList = {} } = row
  const level = getSpanLevel(column, spanLevelList)
  let spanNum = 1
  if (level !== null) {
    spanNum = $spanLevelList[level]
  }
  return [spanNum, 1]
}
