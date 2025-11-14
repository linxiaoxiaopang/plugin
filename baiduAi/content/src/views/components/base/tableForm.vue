<template>
  <el-form
    ref="form"
    class="validate-form-self table-form"
    :class="{ 'is-edit': !disabled }"
    :style="{ width: setPx(option.width) }"
    :model="form"
    :label-width="setPx(option.labelWidth, 80)"
    :label-suffix="labelSuffix"
    :validate-on-rule-change="validData(option.validateOnRuleChange, false)"
    :hide-required-asterisk="option.hideRequiredAsterisk"
    @submit.native.prevent
    @validate="handleValidate"
  >
    <el-table
      ref="table"
      border
      class="table-border"
      :class="{ 'not-empty-text': !hasEmptyText }"
      :data="form.tableData"
      :row-key="option.rowKey"
      :max-height="option.maxHeight"
      :row-class-name="tableRowClassName"
      v-on="$listeners"
    >
      <!-- 选择框 -->
      <template v-if="option.selection">
        <el-table-column
          type="selection"
          width="50"
          align="center"
          :selectable="option.selectable"
          :reserve-selection="option.reserveSelection"
        ></el-table-column>
      </template>

      <el-table-column
        v-for="column in columnOption"
        :key="column.prop"
        v-bind="column"
      >
        <template v-if="!column.formatter || !column.disabled" #default="scoped">
          <slot :name="column.prop" v-bind="scoped">
            <template v-if="!column.disabled && column.children">
              <el-form-item
                v-for="item in column.children || []"
                :key="`${item.prop}${form.tableData[scoped.$index].$key}`"
                :label="item.label"
                :prop="getFormItemProp(scoped.$index, item.prop)"
                :rules="parseRules(item, column)"
                :label-width="setPx(validData(item.labelWidth, option.labelWidth, 0))"
                :show-message="validData(item.showMessage, column.showMessage, option.showMessage, false)"
                :class="{ 'show-message': validData(item.showMessage, column.showMessage, option.showMessage, false) }"
              >
                <component
                  :is="getComponent(item.type)"
                  v-model="form.tableData[scoped.$index][item.prop]"
                  v-bind="item"
                  :dic="getDic(item, scoped.row)"
                  :disabled="getDisabled(item, scoped.row)"
                  :size="validData(item.size, $formOptions.size)"
                  @input="oninput"
                  @change="oninput"
                ></component>
              </el-form-item>
            </template>
            <template v-else>{{ detail(scoped.row, column) }}</template>
          </slot>
        </template>
      </el-table-column>
      <el-table-column
        v-if="!disabled && validData(option.menu, true)"
        label="操作"
        :fixed="option.menuFixed"
        :align="validData(option.menuAlign)"
        :header-align="option.menuHeaderAlign"
        :width="validData(option.menuWidth, 240)"
      >
        <template #default="scoped">
          <slot name="menu" v-bind="scoped"></slot>
          <Popover
            v-if="validData(option.delBtn, true)"
            class="menu-btn-item"
            :disabled="!(canDeleteOnRemainingOne || form.tableData.length > 1)"
            @sureHandler="delTableData(scoped.$index)"
          >
            <template #tip>
              <p>确认{{ delText }}产品？</p>
            </template>
            <template #reference="{ scope: loading }">
              <el-button type="text">{{ delText }}</el-button>
            </template>
          </Popover>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
</template>

<script>
import emitter from 'element-ui/src/mixins/emitter'
import { componentMethodsMixin } from '@/mixins'
import { vaildData } from '@/components/avue/utils/util'
import { findByvalue, setPx, validData } from '@/components/avue/utils/util'
import { cloneDeep, uniq } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'
import moment from 'moment'

export default {
  inheritAttrs: false,
  mixins: [
    emitter,
    componentMethodsMixin(
      'table',
      [
        'toggleRowSelection',
        'clearSelection'
      ]
    )
  ],
  props: {
    option: {
      default: () => ({})
    },
    value: {
      default: () => []
    },
    prop: {
      default: 'tableData'
    },
    disabled: Boolean,
    hasEmptyText: {
      default: true
    },
    canDeleteOnRemainingOne: {
      default: true
    },
    delText: {
      default: '删除'
    }
  },
  data() {
    return {
      validateDisabled: false,
      validateMessages: {},
      form: {}
    }
  },
  computed: {
    columnOption({ option: { column, disabled } }) {
      disabled = validData(disabled, this.disabled)
      return cloneDeep(column).filter(item => {
        item.disabled = validData(item.disabled, disabled)
        return !item.hide
      })
    },
    labelSuffix({ option: { labelSuffix } }) {
      if (typeof labelSuffix === 'boolean') return labelSuffix ? '：' : ''
      return vaildData(labelSuffix, '：')
    },
    formItemProps({ columnOption }) {
      const props = []
      columnOption.forEach(column => {
        column.children?.forEach(item => {
          props.push(item.prop)
        })
      })
      return props
    },
    defaultRow({ formItemProps }) {
      let tempObj = {}
      formItemProps.forEach(prop => {
        tempObj[prop] = ''
      })
      return tempObj
    },

    getRowFormItemProps({ formItemProps }) {
      const props = []
      formItemProps.forEach(prop => {
        props.push((rowIndex) => this.getFormItemProp(rowIndex, prop))
      })
      return (rowIndex) => {
        return props.map(callback => callback(rowIndex))
      }
    },
    error({ validateMessages }) {
      let errorIndexList = []
      for (const key in validateMessages) {
        if (typeof validateMessages[key] === 'string') {
          errorIndexList = errorIndexList.concat(key.match(/(?<=tableData\[)\d+/))
        }
      }
      return {
        errorIndexList: uniq(errorIndexList.filter(item => item).map(item => Number(item)))
      }
    }
  },
  watch: {
    value: {
      handler(value) {
        this.$set(
          this.form,
          'tableData',
          (Array.isArray(value) ? value : []).map(item => Object.assign(item, Object.assign({}, this.defaultRow, item)))
        )
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    addTableData(row = cloneDeep(this.defaultRow)) {
      row.$key = +new Date()
      this.form.tableData.push(row)
      this.oninput()
    },
    delTableData(index) {
      this.form.tableData.splice(index, 1)
      this.oninput()
    },

    oninput() {
      this.$emit('input', this.form.tableData)

      this.dispatch('ElFormItem', 'el.form.change')
    },

    handleValidate(prop, valid, msg) {
      // console.log(prop, valid, msg)

      let { validateMessages } = this
      this.$set(validateMessages, prop, valid || msg)
      if (valid) {
        for (const key in validateMessages) {
          if (validateMessages[key] !== true) msg = validateMessages[key]
        }
      }

      this.$emit('validate', this.prop, msg)
    },
    validate(callback) {
      return this.$refs.form.validate(callback)
    },
    validateField(props, callback) {
      return this.$refs.form.validateField(props, callback)
    },
    validateRow(rowIndex) {
      return new Promise(resolve => {
        const props = this.getRowFormItemProps(rowIndex)
        const propLen = props.length
        const errMsg = []
        this.validateField(props, (errorMessage) => {
          errMsg.push(errorMessage)
          if (errMsg.length >= propLen) resolve(!errMsg.some(Boolean))
        })
      })
    },
    clearValidate(props) {
      this.validateMessages = {}
      return this.$refs.form.clearValidate(props)
    },

    // 选中实例
    toggleSelection(rows, selected) {
      if (rows) {
        rows.forEach((row) => {
          this.toggleRowSelection(row, selected)
        })
      } else {
        this.clearSelection()
      }
    },

    getFormItemProp(rowIndex, prop) {
      return `tableData[${rowIndex}].${prop}`
    },
    tableRowClassName({ rowIndex }) {
      if (this.error.errorIndexList.includes(rowIndex)) return 'is-error-row'
    },
    // 在数据大量改变时，暂时关闭表单校验：在数据改变时会触发表单校验，大量校验会导致卡顿
    validateDisabledOnNextChange() {
      this.validateDisabled = true
      this.$nextTick(function () {
        this.validateDisabled = false
      })
    },
    parseRules({ label, rules }, column) {
      if (this.validateDisabled) return
      if (validatenull(rules)) return
      rules = Array.isArray(rules) ? rules : [rules]
      return rules.map(rule => {
        if (rule.required && !rule.message) rule.message = `${label || column.label}必填`
        return rule
      })
    },
    getDic({ dicData, dicType, prop }, row) {
      let dic = this.option.dic || {}
      return validData(
        dic[dicData], dic[dicType], dic[prop], dic[row[dicData]],
        typeof dicData === 'string' ? undefined : dicData,
        undefined
      )
    },
    getDisabled({ disabled }, row) {
      if (typeof disabled === 'function') return disabled(row)
      return disabled
    },
    getComponent(type) {
      let component = {
        select: 'avueCrudSelect'
      }[type]
      return component || 'avueCrudInput'
    },
    //处理数据
    detail(row, column) {
      let result = ''
      if (column.formatter && typeof column.formatter === 'function') {
        result = column.formatter(row, column, row[column.prop])
      } else {
        result = row[column.prop]
      }
      if (column.type) {
        if ((column.type == 'date' || column.type == 'time' || column.type == 'datetime') && column.format) {
          const format = column.format.replace('dd', 'DD').replace('yyyy', 'YYYY')
          result = moment(result).format(format)
        }
        result = findByvalue(
          typeof column.dicData == 'string' ? this.DIC[column.dicData] : column.dicData,
          result,
          column.props
        )
      }
      this.$set(row, `$${column.prop}`, result)
      return result
    },
    setPx,
    validData
  }
}
</script>

<style lang="scss" scoped>
::v-deep.validate-form-self.el-form {
  .not-empty-text .el-table__empty-block {
    display: none;
  }

  .el-table.el-table--border.table-border {
    border-left: 1px solid $border-color;
    &::after {
      display: block;
    }
    th {
      border-right: none;
    }
  }
  th {
    height: 35px;
    padding: 0;
  }
  td {
    height: 53px;
  }
  .is-disabled {
    .el-button--text {
      color: #CCCCCC;
    }
  }

  &.is-edit {
    td {
      padding: 0;
    }
  }

  .el-form-item {
    margin-bottom: 0;
  }
  .el-form-item__content {
    line-height: 52px;
  }
  .el-form-item__error {
    position: relative;
    top: -10px;
  }
  .is-error-row {
    .el-form-item.show-message:not(.is-error) {
      margin-bottom: 16px;
    }
  }
}
</style>
