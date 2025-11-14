<template>
  <el-col
    class="avue-form__row"
    :class="colClass"
    :offset="column.offset"
    :pull="column.pull"
    :md="span"
    :sm="spansm"
    :xs="24"
    :span="24"
    :style="style"
  >
    <el-form-item
      :label="column.label"
      :prop="column.prop"
      :label-width="labelWidth"
      :show-message="showMessage"
      :error="errorMsg[column.prop]"
    >
      <slot
        v-if="formslot"
        :name="slotName"
        :form="form"
        :prop="column.prop"
        :label="column.label"
        :value="form[column.prop]"
        :column="column"
        :dic="dic"
        :DIC="DIC"
        :disabled="isDisabled"
        :readonly="isReadonly"
        :size="size"
        :placeholder="column.placeholder"
        :setError="setError"
        :validate="handleValidate"
        :formInput="formInput"
        :formChange="formChange"
        :searchChange="searchChange"
      ></slot>
      <avue-crud-tooltip
        v-else-if="['tooltip', 'text'].includes(column.type)"
        effect="dark"
        placement="top"
        :content="detail(form, column)"
      >
        <div class="text-cut">{{ detail(form, column) }}</div>
      </avue-crud-tooltip>
      <component
        v-else
        v-bind="contentAttrs"
        :is="contentComponent"
        :uiid="`zd-${column.prop}`"
        v-model="form[column.prop]"
        :style="contentStyle"
        :trim="column.trim"
        :column="column"
        :precision="column.precision"
        :label="column.label"
        :props="column.props"
        :placeholder="column.placeholder"
        :clearable="column.clearable"
        :type="column.type"
        :size="size"
        :prefix-icon="column.prefixIcon"
        :minRows="column.minRows"
        :maxRows="column.maxRows"
        :maxlength="column.maxlength"
        :dic="dic"
        :disabled="isDisabled"
        :readonly="isReadonly"
        :format="column.format"
        :value-format="column.valueFormat"
        :emitPath="column.emitPath"
        :checkStrictly="column.checkStrictly"
        :show-all-levels="column.showAllLevels"
        :expandTrigger="column.expandTrigger"
        :controls="column.controls"
        :controls-position="column.controlsPosition"
        @search-change="searchChange"
        @input="formInput"
        @change="formChange"
      ></component>
      <slot :name="`${ column.prop }After`" :form="form" :column="column"></slot>
      <slot name="afterFormItem" :column="column"></slot>

      <template #label>
        <slot :name="`${ column.prop }Label`" :form="form" :column="column"></slot>
      </template>  
    </el-form-item>
  </el-col>
</template>

<script>
import { DEFAULT_FORM_SIZE } from '@/components/avue/utils/const/config'
import { upperFirst, omit } from 'lodash'
import { setDic, setPx, validData, getComponent } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  name: 'formTemp',
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    column: {
      type: Object,
      default: () => ({})
    },
    group: {
      type: Object,
      default: () => ({})
    },
    option: {
      type: Object,
      default: () => ({})
    },
    DIC: {
      type: Object,
      default: () => ({})
    },
    errorMsg: {
      type: Object,
      default: () => ({})
    },
    disabled: Boolean,
    readonly: Boolean
  },
  data() {
    return {
      DEFAULT_FORM_SIZE
    }
  },
  computed: {
    dic() {
      return setDic(this.column, this.DIC)
    },
    // 满足formslot为true且slotName为空时，显示插槽的情况（不显示输入框）
    formslot({ column, $scopedSlots }) {
      return validData(column.formslot, column.formSlotName, $scopedSlots[column.prop])
    },
    slotName({ column }) {
      return column.formSlotName || column.prop
    },
    labelWidth() {
      return setPx(this.column.labelWidth, this.option.formItemLabelWidth, this.group.labelWidth, this.option.labelWidth, 80)
    },
    isAutoLabelWidth() {
      return this.labelWidth === 'auto'
    },
    size() {
      return this.column.size || this.group.size || DEFAULT_FORM_SIZE
    },
    showMessage({ column }) {
      return !(column.disabled || column.readonly || this.option.unShowMessage)
    },
    isDisabled() {
      return validData(this.column.disabled, this.group.disabled, this.option.disabled, this.disabled)
    },
    isReadonly() {
      return validData(this.column.readonly, this.group.readonly, this.option.readonly, this.readonly)
    },

    contentComponent() {
      return this.getComponent(this.column.type)
    },
    contentAttrs() {
      return omit(this.column, ['dicData', 'control', 'cascader'])
    },
    contentStyle() {
      return { width: setPx(this.column.contentWidth, this.option.contentWidth) }
    },

    colClass({ column }) {
      return [
        {
          [`avue-form__row-${ column.prop }`]: column.prop,
          'is-auto': this.isAutoLabelWidth
        },
        column.colClass,
        this.option.colClass
      ]
    },

    span() {
      return this.column.span || this.group.span || this.option.span || 12
    },
    spansm() {
      return this.column.spansm || this.group.spansm || this.option.spansm || this.span || 12
    },
    style({ column }) {
      return {
        width: setPx(column.width, this.option.formItemWidth, this.isAutoLabelWidth ? 'auto' : undefined),
        minWidth: setPx(column.minWidth),
        marginLeft: setPx(column.marginLeft)
      }
    }
  },
  methods: {
    searchChange(...args) {
      this.$emit('search-change', this.column.prop, ...args)
    },
    formInput(...args) {
      this.$emit('form-input', this.column.prop, ...args)
    },
    formChange(...args) {
      this.$emit('form-change', this.column.prop, ...args)
    },
    setError(prop, error) {
      // console.log(prop, error)
      let { errorMsg } = this
      if (errorMsg[prop] === error) {
        errorMsg[prop] = ''
        this.$nextTick(function () {
          this.$set(errorMsg, prop, error)
        })
      } else {
        this.$set(errorMsg, prop, error)
      }
    },
    handleValidate(prop, valid, error) {
      // console.log(prop, valid, error)
      this.setError(prop, error)
    },
    detail(form, column) {
      let { formatter, prop, placeholder } = column
      let value = form[prop]
      if (validatenull(value)) return placeholder
      if (typeof formatter === 'function') return formatter(value, form, column)
      return value
    },

    getComponent(type) {
      return upperFirst(getComponent(type)).replace(/^(avue)?/i, 'avue')
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  &.flex-content {
    .el-form-item__content {
      display: flex;
      align-items: center;
    }
  }
}
</style>