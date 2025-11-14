<template>
  <avue-form
    ref="form"
    class="base-form"
    :class="{ 'label-justify': finalOption.isSearch }"
    :option="finalOption"
    :dic="finalDic"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template v-for="slot in scopedSlots" v-slot:[slot.prop]="scope">
      <avueCrudTooltip
        v-if="['tooltip', 'text'].includes(slot.type)"
        :content="tooltipFormatter(scope, slot)"
      ></avueCrudTooltip>
      <component
        v-else-if="components[slot.type]"
        :is="components[slot.type]"
        v-model="scope.form[slot.prop]"
        :form="scope.form"
        :list="setDic(slot, finalOption.dic)"
        :dic="setDic(slot, finalOption.dic)"
        :column="scope.column"
        :size="scope.size"
        :disabled="scope.disabled"
        :readonly="scope.readonly"
        v-bind="slot"
        @input="scope.formInput"
        @change="scope.formChange"
        @search-change="scope.searchChange"
      ></component>
      <slot v-else :name="slot.prop" v-bind="scope"></slot>
    </template>
  </avue-form>
</template>

<script>
import { componentMethodsMixin } from '@/mixins'

import defaultImg from '@/views/components/base/defaultImg'
import selectInput from './module/selectInput'
import inputSelect from './module/inputSelect'

import { setDic, validData, findByvalue } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'
import { accAdd } from '@/utils'
import { cloneDeep } from 'lodash'

export default {
  name: 'baseForm',
  inheritAttrs: false,
  mixins: [
    componentMethodsMixin(
      'form',
      [
        'resetForm',
        'validate',
        'resetFields',
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
    column: Array,
    dic: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      DIC: {}
    }
  },
  computed: {
    finalOption({ finalSettings, finalGroup, finalColumn }) {
      return {
        ...finalSettings,
        group: finalGroup,
        column: finalColumn
      }
    },
    finalSettings({ option }) {
      let isSearch = validData(option.isSearch, false)
      return {
        ...option,
        isSearch,
        labelSuffix: validData(option.labelSuffix, !isSearch),
        labelWidth: validData(option.labelWidth, 82),
        menuBtn: validData(option.menuBtn, false),
        span: validData(option.span, 24)
      }
    },
    finalGroup() {
      return cloneDeep(validData(this.option.group, this.group))
    },
    finalColumn() {
      return cloneDeep(validData(this.option.column, this.column))
    },
    finalDic() {
      return {
        ...this.DIC,
        ...this.dic,
        ...this.option.dic
      }
    },
    parentGroup({ finalSettings, finalGroup, finalColumn }) {
      return [
        ...(finalGroup || []),
        {
          ...finalSettings,
          column: finalColumn,
          group: undefined
        }
      ]
        .map(item => {
          return {
            ...item,
            labelWidth: validData(item.labelWidth, finalSettings.labelWidth)
          }
        })
        .filter(item => item.column)
    },

    scopedSlots({ $scopedSlots, parentGroup }) {
      let scopedSlots = Object.keys($scopedSlots)
      let tempArr = scopedSlots.map(prop => ({ prop }))

      let addSlots = []
      parentGroup.forEach(item => {
        item.column?.forEach(column => {
          // 有设置插槽则开启表单插槽功能
          if (tempArr.some(({ prop }) => prop === column.prop)) {
            column.formslot = true
            column.type = column.type || 'auto'
          }

          // 类型为已注册组件则开启表单插槽功能
          if (this.componentKeys.includes(column.type)) {
            column.formslot = true
            addSlots.push(column)
          }
        })
      })

      return tempArr.concat(addSlots)
    },
    componentKeys({ components }) {
      return Object.keys(components)
    },
    components() {
      return {
        defaultImg,
        inputSelect,
        selectInput,
        tooltip: 'avueCrudTooltip',
        text: 'avueCrudTooltip'
      }
    }
  },
  watch: {
    option: {
      handler() {
        this.handleSearchColumn()
        this.handleTextColumn()

        this.getDic()
      },
      immediate: true,
      deep: true
    }
  },
  activated() {
    this.getDic()
  },
  methods: {
    handleSearchColumn() {
      if (!this.finalOption.isSearch) return
      let { parentGroup } = this

      let defaultWidths = {
        selectInput: 368,
        daterange: 256,
        input: 256,
        select: 256
      }

      parentGroup.forEach(item => {
        let { labelWidth } = item
        item.column.forEach((column) => {
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
      })
    },
    handleTextColumn() {
      let { parentGroup, finalOption: { isText } } = this

      parentGroup.forEach((item) => {
        if (!validData(item.isText, isText)) return
        item.column.forEach((column) => {
          this.$set(column, 'type', validData(column.type, 'text'))
        })
      })
    },

    async getDic() {
      const curRequest = this.DICLastRequest = this.$store.dispatch('HandleOption', { group: this.parentGroup })
      await curRequest
      if (curRequest === this.DICLastRequest) {
        this.DIC = await this.DICLastRequest
      }
    },

    tooltipFormatter({ form, column, column: { formatter, props, placeholder } }, { prop }) {
      let result = form[prop]
      if (typeof formatter === 'function') result = formatter(form, prop, result)
      if (column.type) {
        result = findByvalue(
          setDic(column, this.finalDic),
          result,
          props
        )
      }
      return validData(result, placeholder)
    },
    setDic
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  &.label-justify {
    .el-form-item__label {
      position: relative;
      padding-right: 20px;
      text-align-last: justify;

      &::after {
        content: '：';
        position: absolute;
        right: calc(20px - 1em);
      }
    }
    .select-input {
      margin-top: 4px;
    }
  }
}
</style>
