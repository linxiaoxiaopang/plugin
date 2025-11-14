/* eslint-disable */
import { validatenull } from '@/components/avue/utils/validate'
import { accMul } from '@/utils'


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
  },
  lb: {
    kg: 0.45359237
  }
}
export default function (data, dataType, resultType) {
  // console.log('numberAdd', nums)
  if (validatenull(data)) return 0
  const rate = conversionRate[dataType]?.[resultType]
  if (rate === undefined) return data
  return accMul(data, rate)
}