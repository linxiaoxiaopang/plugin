<template>
  <el-table-column
    ref="column"
    :key="columnOption.$sortKey"
    :prop="columnOption.prop"
    :show-overflow-tooltip="validData(columnOption.showOverflowTooltip, columnOption.overHidden)"
    :min-width="minWidth"
    :sortable="columnOption.sortable"
    :align="validData(columnOption.align, crud.option.align)"
    :header-align="validData(columnOption.headerAlign, crud.option.headerAlign)"
    :width="columnOption.width"
    :label="columnOption.label"
    :fixed="columnOption.fixed"
    :class-name="columnOption.className"
  >
    <template slot="header" slot-scope="scope">
      <slot :name="columnOption.headerSlotName || `${columnOption.prop}Header`" :dic="dic" :tableColumn="columnOption" v-bind="scope">
        <slot name="Header" :dic="dic" :tableColumn="columnOption" v-bind="scope">{{
            columnOption.label
          }}</slot>
      </slot>
    </template>
    <template v-for="column in columnOption.children">
      <column-dynamic v-if="column.children && column.children.length>0"
                      :key="column.label || column.prop"
                      :columnOption="column">
        <template v-for="item in crud.mainSlot"
                  slot-scope="scope"
                  :slot="item">
          <slot v-bind="scope"
                :name="item"></slot>
        </template>
      </column-dynamic>
      <column-slot v-else
                   :column="column"
                   :column-option="columnOption.children">
        <template v-for="item in crud.mainSlot"
                  slot-scope="scope"
                  :slot="item">
          <slot v-bind="scope"
                :name="item"></slot>
        </template>
      </column-slot>
    </template>
  </el-table-column>
</template>

<script>
import column from '@/components/avue/core/column'
import columnSlot from './column-slot'
import { setDic } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  name: 'column-dynamic',
  components: {
    columnSlot
  },
  mixins: [column],
  props: {
    columnOption: Object
  },
  computed: {
    dic() {
      return setDic(this.columnOption, this.crud.DIC)
    },

    minWidth({ columnOption }) {
      if (!validatenull(columnOption.minWidth)) return columnOption.minWidth
      return this.getPxWidth(columnOption)
    }
  },
  methods: {

  }
}
</script>

<style lang="scss" scoped>

</style>