<template>
  <el-table-column
    ref="column"
    :key="column.$sortKey"
    :prop="column.prop"
    :show-overflow-tooltip="validData(column.showOverflowTooltip, column.overHidden)"
    :min-width="minWidth"
    :sortable="column.sortable"
    :align="validData(column.align, crud.option.align)"
    :header-align="validData(column.headerAlign, crud.option.headerAlign)"
    :width="column.width"
    :label="column.label"
    :fixed="column.fixed"
    :class-name="column.className"
  >
    <template slot="header" slot-scope="scope">
      <slot :name="column.headerSlotName || `${column.prop}Header`" :dic="dic" :tableColumn="column" v-bind="scope">
        <slot name="Header" :dic="dic" :tableColumn="column" v-bind="scope">{{
            column.label
          }}</slot>
      </slot>
    </template>
    <template slot-scope="scope">
      <lazyComponent
        :lazy="validData(column.lazy, crud.option.lazy)"
        :lazyMounted="validData(column.lazyMounted, crud.option.lazyMounted)"
        :scrollContainer="crud.option.scrollContainer"
        :isOnePage="crud.option.isOnePage"
        :sign="scope.$index"
        :height="validData(column.lazyHeight, crud.option.lazyHeight)"
      >
        <slot
          :name="column.slotName || column.prop"
          :dic="dic"
          :tableColumn="column"
          v-bind="scope"
        >
          <span v-if="column.type || column.formatter" v-html="detail(scope.row, column, scope.$index)"></span>
          <span v-else>{{ cellDetail(scope.row, column) }}</span>

          <!-- 存在报错信息 -->
          <div v-if="scope.row.asyncValidatorErrorList && scope.row.asyncValidatorErrorList[`_${column.prop}_errMsg`]" class="text-danger">
            {{scope.row.asyncValidatorErrorList[`_${column.prop}_errMsg`]}}
          </div>
        </slot>
      </lazyComponent>
    </template>
  </el-table-column>
</template>

<script>
import lazyComponent from '@/components/avue/crud/src/lazyComponent'
import column from '@/components/avue/core/column'
import moment from 'moment'
import { get } from 'lodash'
import { findByvalue, setDic, validData } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  name: 'column-slot',
  components: {
    lazyComponent: {
      functional: true,
      render(h, { props, scopedSlots }) {
        if (!(props.lazy || props.lazyMounted)) return scopedSlots.default?.()
        return h(
          lazyComponent,
          {
            props,
            scopedSlots
          }
        )
      }
    }
  },
  mixins: [column],
  props: {
    column: Object,
    columnOption: Array,
  },
  computed: {
    dic() {
      return setDic(this.column, this.crud.DIC)
    },
    placeholder() {
      return this.validData(this.column.placeholder, this.crud.option.placeholder)
    },

    minWidth({ column }) {
      if (!validatenull(column.minWidth)) return column.minWidth
      if (this.crud.option.autoHeaderWidth) return this.getPxWidth(column)
    }
  },
  methods: {
    //处理数据
    detail(row, column, index) {
      let result = get(row, column.prop)
      if (column.formatter && typeof column.formatter === 'function') {
        result = column.formatter(row, column, result, index)
      }
      if (column.type) {
        if (column.format && ['date', 'time', 'datetime'].includes(column.type)) {
          const format = column.format.replace('dd', 'DD').replace('yyyy', 'YYYY')
          result = moment(result).format(format)
        }
        result = findByvalue(this.dic, result, column.props)
      }
      this.$set(row, `$${column.prop}`, result)
      return result
    },
    cellDetail(row, column) {
      const { prop } = column
      const value = get(row, prop)
      return validData(value, this.placeholder)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>