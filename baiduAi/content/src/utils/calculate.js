/* eslint-disable */
import { validatenull } from '@/components/avue/utils/validate'
import { SYS_YES } from '@/utils/constant/statusConst'
import Big from 'big.js'

/**
 * 数字相加
 * @param {Array} nums
 * @returns {Number}
 * @example see @/views/order/module/pushGroup.vue
 */
export function numberAdd(nums) {
  return accAdd(...nums)
}

// 两位小数
export function toFixed(num, precision) {
  return new Big(num).toFixed(precision)
}

// 数据换算率
export const conversionRate = {
  cm: {
    in: 0.39370078740157
  },
  in: {
    cm: 2.54
  },
  g: {
    lb: 0.00220462262184
  }
}
export function conversionData(data, dataType, resultType) {
  // console.log('numberAdd', nums)
  if (validatenull(data)) return 0
  if (!conversionRate[dataType] || !conversionRate[dataType][resultType])
    return data
  return data * conversionRate[dataType][resultType]
}
export function conversionCMToIN(data) {
  return conversionData(data, 'cm', 'in').toFixed(4)
}
export function conversionGToLB(data) {
  return conversionData(data, 'g', 'lb').toFixed(4)
}


/**
 *  获取运费
 * @param {string|number} weight
 * @param {string|number} length
 * @param {string|number} width
 * @param {string|number} height
 * @param {array} templateConfigList 运费模板列表
 * @param {number} compareWeightMultiple 抛重大于实重多少倍时计泡
 * @param {number} isByCompareWeightMultiple 是否抛重与实重倍数比较
 * @param {number} calculateMode 运费计算模式
 * @param {number} isByActualWeight 是否计算实际重量
 * @param {number} isByVolumetricWeight 是否计算计泡重量
 * @param {number} volumeDivisor 材积除数
 * @param {number} count 购买数量
 * @returns
 */
export function getExpressCost(
  {
    weight,
    length,
    width,
    height
  },
  templateConfigList,
  {
    compareWeightMultiple,
    isByCompareWeightMultiple,
    calculateMode,
    isByActualWeight,
    isByVolumetricWeight,
    volumeDivisor
  },
  count = 1
) {
  let actualWeight = accMul(weight, count)
  let volumetricWeight = 0
  let $isByVolumetricWeight = isByVolumetricWeight === SYS_YES
  let $chargedWeight = Math.max(actualWeight, volumetricWeight)
  if ($isByVolumetricWeight) {
    // (length * width * height / volumeDivisor) * count
    volumetricWeight = Math.floor(
      parseNumber(accMul(accDiv(accMul(length, width, height), accDiv(volumeDivisor, 1000)), count))
    )
    // console.log('volumetricWeight', (length * width * height / volumeDivisor) * count, volumetricWeight)
    if (isByCompareWeightMultiple) {
      if (accMul(actualWeight, compareWeightMultiple) > volumetricWeight) {
        $chargedWeight = actualWeight
        $isByVolumetricWeight = false
      } else {
        $chargedWeight = Math.floor(volumetricWeight)
        $isByVolumetricWeight = true
      }
    }
  }

  let cost = 0
  let template = getExpressTemplate(templateConfigList, $chargedWeight)
  let $isOverflow = false
  if (template) {
    let {
      registrationFee,
      emergencySurcharge
    } = template
    switch (calculateMode) {
      case 1:
        let {
          firstFreight,
          firstWeight,
          continuedWeight,
          continuedFreight
        } = template
        // $chargedWeight - firstWeight
        let restWeight = accSub($chargedWeight, firstWeight)
        if (restWeight < 0) restWeight = 0
        // restWeight / continuedWeight
        let continuedTotalWeight = Math.ceil(accDiv(restWeight, continuedWeight))
        // (firstFreight + continuedTotalWeight * continuedFreight) + registrationFee + emergencySurcharge
        cost = accAdd(firstFreight, accMul(continuedTotalWeight, continuedFreight), registrationFee, emergencySurcharge)
        break
      case 2:
        let {
          freight
        } = template
        cost = accAdd(freight, registrationFee, emergencySurcharge)
        break
    }
  } else {
    $isOverflow = true
    template = {}
  }

  return {
    templateConfigList,
    template: {
      ...template,
      $isOverflow,
      $chargedWeight,
      $calculateMode: calculateMode,
      isByActualWeight,
      isByVolumetricWeight,
      $volumeDivisor: volumeDivisor,
      $actualWeight: actualWeight,
      $volumetricWeight: volumetricWeight,
      $isByVolumetricWeight
    },
    cost: cost || 0
  }
}
// 获取运费模板
export function getExpressTemplate(templateList, weight) {
  return templateList
    .find(({ startWeight, endWeight }) => weight >= startWeight && weight <= endWeight)
}

export function accFactory(method = 'plus') {
  return function (...nums) {
    nums = nums.map(Number).filter((num) => num || num === 0)
    if (nums.length < 2) return nums[0] || 0
    return Number(
      nums.slice(1).reduce((prev, num) => prev[method](num), new Big(nums[0]))?.toString()
    ) || 0
  }
}
// 浮点数求和
export const accAdd = accFactory('plus')
// 浮点数相减
export const accSub = accFactory('minus')
// 浮点数相除
export const accDiv = accFactory('div')
// 浮点数相乘
export const accMul = accFactory('times')
