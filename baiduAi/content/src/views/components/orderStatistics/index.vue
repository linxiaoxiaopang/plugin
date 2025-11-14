<template>
  <el-popover class="ml10" placement="right" trigger="hover" :disabled="!selectionData.length">
    <baseTable :data="styleList" :option="option" style="width: 735px"></baseTable>
    <span class="cursor-pointer" slot="reference">款式统计</span>
  </el-popover>
</template>

<script>
import { flatMapDeepByArray } from '@/utils'
import { flatten } from 'lodash'

export default {
  props: {
    selectionData: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    styleList({ selectionData }) {
      let orderItemDTOList = flatMapDeepByArray(selectionData, ['orderItemDTOList'])
      orderItemDTOList = flatten(
        orderItemDTOList.map(item => item.orderItemChildren || item)
      )

      const data = orderItemDTOList.reduce((pre, { productStructName, productCount }) => {
        if (productStructName in pre) pre[productStructName] += productCount
        else pre[productStructName] = productCount
        return pre
      }, {})
       
      const res = []
      
      for (let [productStructName, productCount] of Object.entries(data)) {
        res.push({
          productStructName: productStructName || '未关联',
          productCount
        })
      }
      return res
    },

    option() {
      return {
        menu: false,
        hideOnSinglePage: true,
        paginationPopperAppendToBody: false,
        pageSize: 10,
        pageSizes: [5, 10],
        column: [
          {
            label: '款式',
            prop: 'productStructName',
            minWidth: 300
          },
          {
            label: '数量',
            prop: 'productCount',
            minWidth: 250
          }
        ]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
  color: $--color-primary;
}
</style>
