/* eslint-disable */
import { accMul } from '@/utils/calculate'
import { validatenull } from '@/components/avue/utils/validate'
import { find, map } from 'lodash'

export function getDiscountPrice(price) {
  return accMul(price, 1)
}

export function findPriceByCount(sizeLevelCategoryPriceList, count) {
  if (validatenull(sizeLevelCategoryPriceList)) return 0

  let price
  let minPriceInfo = {}
  let maxPriceInfo = {}
  sizeLevelCategoryPriceList.forEach((item) => {
    let { minCount, maxCount } = item.levelCategoryItem || {}
    if (minPriceInfo.price === undefined || Number(item.price) <= Number(minPriceInfo.price)) {
      minPriceInfo.price = item.price
      minPriceInfo.maxCount = maxCount
    }
    if (maxPriceInfo.price === undefined || Number(item.price) >= Number(maxPriceInfo.price)) {
      maxPriceInfo.price = item.price
      maxPriceInfo.minCount = minCount
    }
    if (minCount <= count && count <= maxCount) price = item.price
  })
  // 数量越多价格越低
  if (count > minPriceInfo.maxCount) price = minPriceInfo.price
  if (count < maxPriceInfo.minCount) price = maxPriceInfo.price
  return price
}
export function findPriceByCountPure(sizeLevelCategoryPriceList, count) {
  if (validatenull(sizeLevelCategoryPriceList)) return 0
  
  count = count < 1 ? 1 : count > 9999 ? 9999 : count
  return sizeLevelCategoryPriceList.find((item) => {
    let { minCount, maxCount } = item.levelCategoryItem || {}
    return minCount <= count && count <= maxCount
  })?.price
}

/**
 * @description: 产品取档位minCount为1的最低价
 */
export function getProductListMinPrice(sizeList) {
  console.log('sizeLst', sizeList)
  if (validatenull(sizeList)) return 0
  const val = sizeList.map(({ sizeLevelCategoryPriceList }) => {
    sizeLevelCategoryPriceList = (sizeLevelCategoryPriceList || []).map((pItem) => {
      pItem.price = getDiscountPrice(pItem.price)
      return pItem
    })

    return findPriceByCount(sizeLevelCategoryPriceList, 1)
  })
  let price = Math.min(...val)
  if (!price && price !== 0) {
    price = $GET(sizeList, '[0].sizeLevelCategoryPriceList[0].price', 0)
  }
  return price.toFixed(2)
}

/**
 * @description: 产品列表价格 尺码id最小的（固定档位只有一个价格 系统阶梯价的取一件的价格）
 */
export function getMinPrice(sizeList) {
  if (validatenull(sizeList)) return 0
  var sizeListEnd=sizeList.slice(-1)[0]
  const priceList = map(sizeListEnd.sizeLevelCategoryPriceList, 'price')
  return priceList[0]
}

/**
 * @description: 原型取档位最低价
 */
export function getPrototypeListMinPrice(sizeList) {
  if (validatenull(sizeList)) return 0
  const allPrice = []
  sizeList.forEach(({ sizeLevelCategoryPriceList }) => {
    sizeLevelCategoryPriceList = (sizeLevelCategoryPriceList || []).map((pItem) => {
      pItem.price = getDiscountPrice(pItem.price)
      return pItem
    })

    sizeLevelCategoryPriceList.forEach((pItem) => {
      allPrice.push(pItem.price)
    })
  })
  let price = Math.min(...allPrice)
  if (!price && price !== 0) {
    price = $GET(sizeList, '[0].sizeLevelCategoryPriceList[0].price', 0)
  }
  return price.toFixed(2)
}

// 部分尺码未定制
export function getSpecificSizeList(data) {
  const sizeIdList = []
  data.customProductList.forEach(({ customSpecificProductList }) => {
    customSpecificProductList.forEach(({ sizeId }) => sizeIdList.push(sizeId))
  })
  return getProductSizeList(data.productPrototype).filter(({ id }) => sizeIdList.includes(id))
}
// 原型价格档位改变后未上架，应显示之前的价格档位
export function getProductSizeList(productPrototype) {
  let { sizeList, levelCategoryPriceModifyRecord } = productPrototype
  if (levelCategoryPriceModifyRecord?.levelCategoryPriceDetail) {
    let tempObj = {}
    JSON.parse(levelCategoryPriceModifyRecord.levelCategoryPriceDetail).forEach((item) => {
      if (!tempObj[item.sizeId]) tempObj[item.sizeId] = []
      tempObj[item.sizeId].push(item)
    })
    sizeList = []
    for (const id in tempObj) {
      sizeList.push({
        id: Number(id),
        sizeLevelCategoryPriceList: tempObj[id]
      })
    }
  }
  return (productPrototype.oSizeList = sizeList)
}

/**
 * @description: 固定档位价格
 * @return: { Object } { sizeId: price }
 */
export function getFixedLevelPrices(sizeList) {
  if (validatenull(sizeList)) return {}
  return sizeList.reduce((prev, { id, sizeLevelCategoryPriceList }) => {
    if (Array.isArray(sizeLevelCategoryPriceList) && sizeLevelCategoryPriceList.length === 1) {
      prev[id] = sizeLevelCategoryPriceList[0].price
    }
    return prev
  }, {})
}
