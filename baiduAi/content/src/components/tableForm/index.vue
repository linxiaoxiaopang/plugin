<template>
  <el-form
    ref="form"
    class="table-form"
    :class="{ 'is-auto-form': isAutoForm }"
    size="small"
    :model="form"
    :label-width="setPx(option.formLabelWidth)"
    :label-suffix="labelSuffix"
    :hide-required-asterisk="option.hideRequiredAsterisk"
    @validate="onValidate"
  >
    <baseTable ref="baseTable" :propsOption="baseTablePropsOption" :option="option" v-bind="$attrs" v-on="$listeners">
      <template #tableFormItem="scope">
        <el-row v-if="formColumns[scope.tableColumn.prop]" class="table-form-item-wrapper" :gutter="option.formGutter">
          <el-col
            v-for="(item, index) in getDisplayColumn(formColumns[scope.tableColumn.prop], scope)"
            :key="`${getFormItemProp(item, scope)}--${keyMap.get(scope.row)}`"
            :span="validData(item.span, 24)"
            :offset="item.offset"
            :style="{ width: setPx(item.formItemWidth) }"
            :class="[item.tableFormItemClassName, item.tableFormItemSlotName]"
          >
            <el-form-item
              class="table-form-item"
              :row="scope.row"
              :label="item.showLabel ? item.label : undefined"
              :label-width="setPx(item.labelWidth)"
              :prop="getFormItemProp(item, scope)"
              :required="item.required"
              :rules="item.rules"
              :inline-message="true"
            >
              <slot :name="item.tableFormItemSlotName" :formColumn="item" :dic="setDic(item, scope)" v-bind="scope">
                <slot :name="`${item.prop}TableFormItem`" :formColumn="item" :dic="setDic(item, scope)" v-bind="scope">
                  <formTemp
                    :form="scope.row"
                    :column="item"
                    :disabled="getResult(item.disabled, scope)"
                    :dic="setDic(item, scope)"
                    @blur="getResult(item.blur, scope)"
                    @clear="getResult(item.clear, scope)"
                    @change="getResult(item.change, scope)"
                  ></formTemp>
                </slot>
              </slot>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <template #defaultImg="{ row, tableColumn }">
        <defaultImg
          class="default-image text-right"
          :src="row[tableColumn.prop]"
          :width="tableColumn.imageWidth"
          :height="tableColumn.imageHeight"
          :value="row"
          :carouselProp="tableColumn.carouselProp"
          :previewProp="tableColumn.previewProp"
        >
          <template #referenceFooter>
            <slot name="defaultImgText">{{ row[tableColumn.textProp] }}</slot>
          </template>
        </defaultImg>
      </template>

      <template v-for="(val, key) in $scopedSlots" v-slot:[key]="scope">
        <slot :name="key" v-bind="scope"></slot>
      </template>
    </baseTable>
  </el-form>
</template>

<script>
import formTemp from '@/components/avue/form/src/formTemp'
import defaultImg from '@/views/components/defaultImg'
import propsTargetMixin from '@/mixins/parentProps/propsTargetMixin'
import componentMethods from '@/mixins/componentMethods'
import { validatenull } from '@/components/avue/utils/validate'
import { setDic, setPx, validData } from '@/components/avue/utils/util'
import { flatten, map, chain } from 'lodash'
import { getResult } from '@/utils/functional'

export default {
  inheritAttrs: false,
  components: {
    formTemp,
    defaultImg
  },
  mixins: [
    componentMethods('baseTable', ['toggleTab']),
    propsTargetMixin({
      dataAttrs: {
        finalData: [],
        finalDic: {},
        finalColumn: []
      }
    })
  ],
  props: {
    option: {},
    propsOption: Object | Array,
    disabled: Boolean
  },
  data() {
    return {
      form: {},
      keyMap: new Map()
    }
  },
  computed: {
    formProps() {
      return map(this.flatColumn, 'prop')
    },
    flatColumn() {
      return flatten(Object.values(this.formColumns))
    },
    tableProps() {
      return Object.keys(this.formColumns)
    },
    formColumns({ option }) {
      if (this.disabled) return {}
      const tmpObj = {}
      const list = chain(option.column)
        .cloneDeep()
        .flatMap((item) => {
          return [item].concat(item.children || [])
        })
        .value()
      for (const column of list) {
        if (column.slotName) continue

        let list
        if (column.cell || column.tableFormItemSlotName) list = [column]
        if (!validatenull(column.column)) list = Array.isArray(column.column) ? column.column : [column.column]
        if (validatenull(list)) continue

        for (const ele of list) {
          // 默认不显示label
          ele.showLabel = validData(ele.showLabel, false)

          // 格式化rules
          if (ele.rules) {
            let rules = Array.isArray(ele.rules) ? ele.rules : [ele.rules]
            ele.rules = rules.map((rule) => {
              if (rule.required === true) {
                return {
                  message: `${ele.label || '该项'}必填`,
                  ...rule
                }
              } else if (rule.validatorRow) {
                return {
                  validator: (...args) => {
                    const tableData = this.finalData
                    const index = args[0].field.split('.')[1]
                    const row = tableData[index]
                    args[3] = row || args[3]
                    rule.validatorRow(...args, this)
                  }
                }
              }
              return rule
            })
          }
        }
        tmpObj[column.prop] = list
      }
      return tmpObj
    },

    labelSuffix({ option: { labelSuffix } }) {
      if (typeof labelSuffix === 'boolean') return labelSuffix ? '：' : ''
      return validData(labelSuffix, '：')
    },
    isAutoForm({ option }) {
      return validData(option.isAutoForm, option.formLabelWidth === 'auto')
    },

    baseTablePropsOption() {
      return [this.propsOption, this.propsTargetOption].filter(Boolean)
    }
  },
  watch: {
    finalData: {
      handler(finalData) {
        const { formProps, keyMap } = this
        const keys = [...keyMap.values()]
        let key = 0
        let nKeyMap = new Map()

        for (const row of finalData) {
          for (const prop of formProps) {
            // 设置响应式，解决输入框输入后未触发校验问题
            !row.hasOwnProperty(prop) && this.$set(row, prop, row[prop])
          }

          const oKey = keyMap.get(row)
          nKeyMap.set(row, oKey ? oKey : getKey())
        }
        this.form.tableData = finalData

        this.keyMap = nKeyMap
        function getKey() {
          return keys.includes(++key) ? getKey() : key
        }
      },
      immediate: true
    },
    finalColumn: {
      handler(finalColumn) {
        const { tableProps } = this
        const list = chain(finalColumn)
          .flatMap((item) => {
            return [item].concat(item.children || [])
          })
          .value()
        for (const column of list) {
          if (tableProps.includes(column.prop)) column.slotName = 'tableFormItem'
        }
      },
      immediate: true
    }
  },
  methods: {
    validate(cb) {
      return this.$refs.form.validate(cb)
    },
    validateField(field, callback) {
      return this.$refs.form.validateField(field, callback)
    },
    clearValidate(props) {
      return this.$refs.form.validateField(props)
    },
    clearValidateByRowIndexes(rowIndexes) {
      rowIndexes = [].concat(rowIndexes)
      const { tableProps } = this
      const props = []
      for (const rowIndex of rowIndexes) {
        for (const prop of tableProps) {
          props.push(this.getFormItemProp({ prop }, { $index: rowIndex }))
        }
      }
      return this.$refs.form.clearValidate(props)
    },

    toggleRowExpansion(row, expanded) {
      return this.$refs.baseTable.toggleRowExpansion(row, expanded)
    },
    doLayout() {
      return this.$refs.baseTable?.doLayout()
    },

    onValidate() {
      this.$nextTick(this.doLayout)
    },

    getFormItemProp(item, scope) {
      return `tableData.${scope.$index}.${item.prop}`
    },

    getDisplayColumn(column, scope) {
      return (column || []).filter((col) => !getResult(col.hide, scope))
    },
    setDic(item, scope) {
      const { finalDic } = this
      return validData(
        getResult(item.getDic, scope, finalDic, item),
        setDic(item, finalDic)
      )
    },

    validData,
    setPx,
    getResult
  }
}
</script>

<style lang="scss" scoped>
.table-form-item {
  margin-bottom: 0;
}
.item-gutter {
  .table-form-item-wrapper {
    text-align: left;
    .el-col:not(:last-child) .table-form-item {
      margin-bottom: 10px;
    }
  }
}
::v-deep {
  &.is-auto-form {
    .el-form-item__label-wrap {
      margin-left: 0 !important;
    }
  }
}
td.is-center {
  .default-image {
    justify-content: center;
  }
}
</style>