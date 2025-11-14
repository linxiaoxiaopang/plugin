<template>
  <avue-form
    ref="form"
    uiid="zd-search"
    :class="{ 'label-justify': finalOption.isSearch }"
    :option="finalOption"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template v-for="slot in scopedSlots" v-slot:[slot.prop]="scope">
      <component
        v-if="components[slot.type]"
        :is="components[slot.type]"
        :uiid="`zd-${slot.prop}`"
        :size="scope.size"
        v-model="scope.form[slot.prop]"
        :form="scope.form"
        :list="validData(slot.dicData, scope.dic)"
        :dic="validData(slot.dicData, scope.dic)"
        :searchList="validData(slot.searchList, scope.DIC[slot.searchListProp])"
        :column="scope.column"
        v-bind="slot"
        @search-change="searchChange"
      ></component>
      <slot v-else :name="slot.prop" v-bind="scope"></slot>
    </template>
  </avue-form>
</template>

<script>
import { componentMethodsMixin } from '@/mixins'

import defaultImg from '@/views/components/defaultImg'
import listRadioGroup from '@/views/components/form/listRadioGroup'
import selectInput from './selectInput'
import inputSelect from './inputSelect'
import defaultValueInput from './defaultValueInput'

import { validData } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'
import { accAdd } from '@/utils'
import { cloneDeep } from 'lodash'

const components = {
  defaultImg,
  inputSelect,
  selectInput,
  listRadioGroup,
  defaultValueInput
}

export default {
  inheritAttrs: false,
  mixins: [
    componentMethodsMixin(
      'form',
      [
        'resetForm',
        'validate',
        'validateField',
        'clearValidate',
        'submit'
      ]
    )
  ],
  props: {
    option: {
      type: Object,
      default: () => ({})
    },
    group: Array,
    column: Array
  },
  computed: {
    finalOption({ option, finalColumn, finalGroup }) {
      let isSearch = validData(option.isSearch, true)
      return {
        ...option,
        group: finalGroup.length ? finalGroup : undefined,
        column: finalColumn.length ? finalColumn : undefined,
        dic: undefined,
        isSearch,
        labelSuffix: validData(option.labelSuffix, !isSearch),
        labelWidth: validData(option.labelWidth, 82),
        menuBtn: validData(option.menuBtn, false),
        span: validData(option.span, 24)
      }
    },
    finalGroup({ group, option }) {
      group = validData(group, option.group, [])
      return group.map(item => ({
        ...item,
        column: this.handleColumn(item.column)
      }))
    },
    finalColumn({ column, option }) {
      return this.handleColumn(validData(column, option.column, []))
    },

    scopedSlots({ $scopedSlots, finalColumn }) {
      let scopedSlots = Object.keys($scopedSlots)
      let tempArr = scopedSlots.map(prop => ({ prop }))

      let addSlots = []
      finalColumn.forEach(column => {
        // 有设置插槽则开启表单插槽功能
        if (tempArr.some(({ prop }) => prop === column.prop)) {
          column.formslot = true
        }

        // 类型为已注册组件则开启表单插槽功能
        if (this.componentKeys.includes(column.type)) {
          column.formslot = true
          addSlots.push(column)
        }
      })

      return tempArr.concat(addSlots)
    },
    componentKeys() {
      return Object.keys(components)
    },
    components() {
      return components
    }
  },
  watch: {
    finalOption: {
      handler() {
        this.handleSearchColumn()
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    handleColumn(column) {
      column = cloneDeep(column)
      let { dic = {} } = this.option
      column.forEach(column => {
        let dicData = validData(dic[column.dicType], dic[column.prop])
        if (dicData) {
          column.dicData = dicData
        }

        column.rules?.forEach(rule => {
          rule.validatorFactory && !rule.validator && (rule.validator = rule.validatorFactory(this.$attrs.value, this))
        })
      })
      this.$store.dispatch('HandleOption', { column })
      return column
    },
    handleSearchColumn() {
      if (!this.finalOption.isSearch) return
      let { column, labelWidth } = this.finalOption

      let defaultWidths = {
        selectInput: 368,
        daterange: 256,
        input: 256,
        select: 256
      }
      Array.isArray(column) && column.forEach((column) => {
        let type = validData(column.type, 'input')

        if (validatenull(column.labelWidth)) {
          // label 不存在表示该项不是单行
          column.labelWidth = column.label ? labelWidth : 20
        }

        if (validatenull(column.width) && validatenull(column.span)) {
          let defaultWidth = defaultWidths[type]
          defaultWidth && (column.width = accAdd(defaultWidth, column.labelWidth))
        }

        if (type === 'input') {
          column.prefixIcon = validData(column.prefixIcon, 'el-icon-search')
        }
      })
    },

    searchChange() {
      // console.log('onsubmit')
      if (this.finalOption.isSearch) {
        // console.log('searchChange')
        return this.submit()
      }
    },

    validData
  }
}
</script>

<style lang="scss" scoped>
.label-justify ::v-deep {
  .select-input {
    margin-top: $form-item-top;
  }
}
</style>
