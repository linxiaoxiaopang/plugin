/* eslint-disable */
import { hasOwnProperties, setDic, validData } from '@/components/avue/utils/util'

export default {
  inject: ['crud'],
  methods: {
    getPxWidth({ label, prop }) {
      if (!this.crud.option.autoHeaderWidth || hasOwnProperties(this.crud.$scopedSlots, [`${prop}Header`, 'Header'])) return
      return Math.ceil(
        (label?.pxWidth(this.crud.option.headerFont || 'normal 14px Robot') || 0) + (
          this.crud.option.paddingLen || 24
        )
      ) // 可能还有边距/边框等值，需要根据实际情况加上
    },
  
    setDic,
    validData
  }
}