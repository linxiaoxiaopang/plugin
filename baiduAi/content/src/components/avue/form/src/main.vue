<template>
  <div class="form-container pull-auto" :class="{ 'is-group': option.group }">
    <el-form
      ref="form"
      :model="form"
      :size="option.size || DEFAULT_FORM_SIZE"
      :label-width="setPx(option.labelWidth, 80)"
      :label-suffix="labelSuffix"
      :class="{ labelSuffix }"
      :style="{ width: setPx(option.width) }"
      :rules="formRules"
      :label-position="option.labelPosition"
      :validate-on-rule-change="vaildData(option.validateOnRuleChange, false)"
      :hide-required-asterisk="option.hideRequiredAsterisk"
      :showMessage="option.showMessage"
      @submit.native.prevent
      @validate="onvalidate"
    >
      <el-row :span="24">
        <el-col
          v-for="(item, index) in columnOption"
          :key="index"
          :span="vaildData(option.columnSpan, 24)"
          class="avue-group"
          :class="`${item.customClass || ''}${item.prop ? ` avue-group__${item.prop}` : ''}`"
        >
          <el-row :span="24" v-show="!hiddenEmptyGroup || getDisplayColumn(item.column).length" class="avue-group__item" :gutter="validData(option.gutter, item.gutter)">
            <div v-if="item.label" class="avue-group__header" :style="{ marginLeft: setPx(item.gutter / 2) }">
              <slot :name="`${item.prop}Header`" v-bind="item">
                <div class="avue-group__title">{{ item.label }}</div>
              </slot>
            </div>
            <div v-else-if="$slots.header" class="avue-group__header" :style="{ marginLeft: setPx(item.gutter / 2) }">
              <slot name="header"></slot>
            </div>
            <div class="avue-form__group clearfix">
              <template v-for="(column, index) in getDisplayColumn(item.column)">
                <formItem
                  :key="column.prop"
                  :form="form"
                  :column="column"
                  :group="item"
                  :option="option"
                  :DIC="DIC"
                  :errorMsg="errorMsg"
                  :disabled="disabled"
                  :readonly="readonly"
                  @search-change="searchChange"
                  @form-input="formInput"
                  @form-change="formChange"
                >
                  <template v-for="(key) in getFormItemSlots(column)" v-slot:[key]="scope">
                    <slot :name="key" v-bind="scope"></slot>
                  </template>
                </formItem>
              </template>
            </div>
          </el-row>
        </el-col>

        <el-col v-if="menuBtn" :span="vaildData(option.menuSpan, 24)" class="form-menu-wrapper">
          <el-form-item label-width="0">
            <div class="form-menu" :class="menuPosition">
              <el-button
                v-if="vaildData(option.emptyBtn, true)"
                plain
                :size="option.emptySize || option.size || DEFAULT_FORM_SIZE"
                @click="resetForm"
              >{{
                option.emptyText ? option.emptyText : '取消'
              }}</el-button>
              <el-button
                v-if="vaildData(option.submitBtn, true)"
                type="primary"
                :size="option.submitSize || option.size || DEFAULT_FORM_SIZE"
                :loading="loading"
                @click="submit"
                >{{ option.submitText ? option.submitText : '保存' }}</el-button
              >
              <slot name="menuForm"></slot>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script>
import formItem from './formItem'
import { DEFAULT_FORM_SIZE } from '../../utils/const/config'
import crud from '../../mixins/crud'
import { validatenull } from '../../utils/validate.js'
import { vaildData } from '@/components/avue/utils/util'
import { getDic, getDicName } from '@/components/avue/core/dic'
import { GetLastPromise } from '@/utils/promise'
import { reduce, find, hasIn } from 'lodash'

export default {
  name: 'AvueForm',
  mixins: [crud()],
  components: { formItem },
  props: {
    value: {
      type: Object,
      required: true,
      default: () => {
        return {}
      }
    },
    disabled: Boolean,
    readonly: Boolean,
    hiddenEmptyGroup: Boolean,
    option: {
      type: Object,
      required: true,
      default: () => ({})
    },
    dic: {
      type: Object,
      default: () => ({})
    },
    scrollIntoViewOnValidate: Boolean,
    colShowFilterFunction: {
      type: Function,
      default: (col) => {
        return !col.hide
      }
    }
  },
  data() {
    return {
      DEFAULT_FORM_SIZE,
      formCreate: false,
      form: {},
      formRules: {},
      DIC: {},

      columnOptionReactive: [],

      loading: false,

      errorMsg: {}
    }
  },
  computed: {
    parentOption({ option }) {
      let group = option.group || []
      option.column &&
        group.push({
          ...option,
          group: undefined
        })
      return {
        ...option,
        group
      }
    },
    columnOption({ parentOption: { group } }) {
      return this.deepClone(group)
    },
    propOption() {
      let tempArr = []
      this.columnOption.forEach((item) => {
        tempArr = tempArr.concat(item.column || [])
      })
      return tempArr
    },
    objectOption() {
      let tempObj = {}
      this.propOption.forEach((column) => {
        tempObj[column.prop] = column
      })
      return tempObj
    },
    controlOption() {
      return this.propOption.filter((column) => column.control)
    },
    cascaderOption() {
      return this.propOption.filter(column => column.cascader)
    },

    labelSuffix({ parentOption: { labelSuffix } }) {
      if (typeof labelSuffix === 'boolean') return labelSuffix ? '：' : ''
      return vaildData(labelSuffix, '：')
    },

    menuBtn() {
      return (
        this.vaildData(this.option.menuBtn, true) &&
        (this.vaildData(this.option.submitBtn, true) ||
          this.vaildData(this.option.emptyBtn, true) ||
          this.$scopedSlots.menuForm)
      )
    },
    menuPosition: function () {
      if (this.option.submitPostion) {
        return 'is-' + this.option.submitPostion
      } else {
        return 'is-center'
      }
    }
  },
  watch: {
    option: {
      handler(n, o) {
        // console.log('option', this.formCreate, n)
        this.formCreate = false
        // this.$nextTick 导致 formVal 在 value 赋值之后执行
        this.formVal()
        // this.rulesInit()
      },
      deep: true
    },
    value: {
      handler(n, o) {
        // console.log('value', this.formCreate, n)
        // console.log(this.option.column[0].prop, JSON.parse(JSON.stringify(this.value)));
        if (this.formCreate) this.formVal()
      },
      deep: true
    },
    columnOption: {
      handler(n, o) {
        // 将columnOption设置为响应式，否则control的修改不会触发重新渲染（hide）
        this.columnOptionReactive = n

        this.formRules = {}
        n.forEach((ele, index) => {
          // ele.column = (ele.column || []).filter(column => !column.hide)
          // 循环列的全部属性
          if (!validatenull(ele.column)) {
            //规则初始化
            this.rulesInit(ele.column)
            //初始化form表单
            this.formInit(ele)
          }
        })
        //初始化dic字典
        this.dicInit()
        //初始化值
        // this.formVal();
      },
      immediate: true,
      deep: true
    },
    form: {
      handler(form) {
        // console.log('form', _.cloneDeep(form))
        let { controlOption, objectOption } = this
        controlOption.forEach((column) => {
          let props = column.control(form[column.prop], form, column, this)
          if (!validatenull(props)) {
            for (const prop in props) {
              Object.assign(objectOption[prop], props[prop])
            }
          }
        })
      },
      immediate: true,
      deep: true
    },
    // cascaderOption不能加deep
    // 加deep时，column的属性变化会引起cascaderWatch重新计算
    // 如control改变column
    cascaderOption: {
      handler(n, o) {
        if (this.cascaderWatch) {
          o.forEach((ele) => this.cascaderWatch[ele.prop]())
        } else {
          this.cascaderWatch = {}
          this.formList = []
        }

        const { objectOption } = this
        n?.forEach((column) => {
          // 防止异步请求产生的执行顺序问题：getDic多次请求时，获取的dic是最晚成功的异步请求返回的
          // 取最后（即最新的）一个，而不是最晚的一个
          const getLastPromises = reduce(column.cascader, (prev, cur) => {
            prev[cur] = new GetLastPromise()
            return prev
          }, {})
          this.cascaderWatch[column.prop] = this.$watch(
            `form.${column.prop}`,
            function () {
              this.$nextTick(() => {
                const cascader = column.cascader;
                const str = cascader.join(",");
                cascader.forEach(item => {
                  const columnNextProp = item;
                  const value = this.form[column.prop];
                  // 下一个节点
                  const columnNext = objectOption[columnNextProp]
                  if (validatenull(columnNext)) return
                  // 如果不是首次加载则清空全部关联节点的属性值和字典值
                  if (this.formList.includes(str)) {
                    //清空子类字典列表和值
                    cascader.forEach(ele => {
                      if (this.validData(columnNext.cascaderClear, this.option.cascaderClear, true)) this.form[ele] = "";
                      if (this.validData(columnNext.cascaderDicClear, this.option.cascaderDicClear, true)) this.$set(this.DIC, getDicName(objectOption[ele]), []);
                    });
                  }
                  /**
                   * 1.判断当前节点是否有下级节点
                   * 2.判断当前节点是否有值
                   */
                  if (
                    validatenull(cascader) ||
                    validatenull(value) ||
                    validatenull(columnNext)
                  ) {
                    return;
                  }
                  // 根据当前节点值获取下一个节点的字典
                  getLastPromises[columnNextProp].wait(getDic({
                    cascaderColumn: column,
                    column: columnNext,
                    value: value,
                    form: this.form,
                    DIC: this.DIC
                  })).then(res => {
                    //首次加载的放入队列记录
                    if (!this.formList.includes(str)) this.formList.push(str);
                    // 修改字典
                    const dic = res || [];
                    this.$set(this.DIC, getDicName(columnNext), dic);
                    if (!validatenull(dic) && !validatenull(columnNext.cascaderIndex) && validatenull(this.form[columnNextProp])) {
                      this.form[columnNextProp] = dic[columnNext.cascaderIndex][(columnNext.props || {}).value || 'value']
                    }
                  });
                })
              })
            },
            { immediate: true }
          )
        })
      },
      immediate: true
    },
    dic: {
      handler(dic) {
        Object.keys(dic).forEach((key) => {
          this.$set(this.DIC, key, dic[key])
        })
      },
      immediate: true
    }
  },
  created() {
    this.$nextTick(function () {
      //规则初始化
      // this.rulesInit()
      //初始化dic字典
      // this.dicInit()
      //初始化form表单
      // this.formInit()
      //初始化值
      this.formVal()
    })
  },
  mounted() {},
  methods: {
    vaildData,
    rulesInit(column) {
      this.errorMsg = {}
      column.forEach((ele) => {
        this.getDicData(ele)
        // this.setCascaderItem('form', ele)

        if (ele.rules && !ele.customValidate) {
          let rules = Array.isArray(ele.rules) ? ele.rules : [ele.rules]
          this.formRules[ele.prop] = rules.map((rule) => {
            if (rule.required === true) {
              return {
                message: `${ele.label || '该项'}必填`,
                ...rule
              }
            } else if (rule.validatorForm) {
              const that = this
              rule.validator = function () {
                arguments[3] = that.form || arguments[3]
                rule.validatorForm(...arguments, that)
              }
            }
            return rule
          })
        }
      })
    },
    dicInit() {
      this.GetDic(this.option.dic).then((data) => {
        Object.keys(data).forEach((key) => {
          this.$set(this.DIC, key, data[key])
        })
      })
    },
    formInit(group) {
      let { disabled, readonly, option, form } = this
      disabled = this.vaildData(group.disabled, option.disabled, disabled)
      readonly = this.vaildData(group.readonly, option.readonly, readonly)
      const list = group.column
      let nForm = {}
      list.forEach((ele) => {
        if (['checkbox', 'cascader', 'daterange', 'array'].includes(ele.type)) {
          nForm[ele.prop] = []
        } else {
          nForm[ele.prop] = ''
        }
        // console.log(ele)
        ele.disabled = this.vaildData(ele.disabled, disabled)
        ele.readonly = this.vaildData(ele.readonly, readonly)
        if (hasIn(ele, 'value') || Array.isArray(ele.value)) nForm[ele.prop] = ele.value
      })
      for (const key in nForm) {
        let value = form[key]
        this.$set(form, key, [undefined].includes(value) ? nForm[key] : value)
      }
    },
    formVal() {
      if (this.formCreate) {
        this.form = this.value
        this.$emit('input', this.form)
      } else {
        this.formCreate = true
        Object.keys(this.form).forEach((ele) => {
          this.value[ele] === undefined && this.$set(this.value, ele, this.form[ele])
        })
        this.form = this.value
        // Object.assign(this.form, this.value);
        this.$emit('input', this.form)
      }
      // console.log(this.option.column[0].prop, JSON.parse(JSON.stringify(this.form)), JSON.parse(JSON.stringify(this.value)));
    },
    searchChange(prop, ...args) {
      this.$emit('search-change', ...args)
      if (this.option.isSearch) {
        this.submit()
      }
    },
    formInput(...args) {
      this.$emit('form-input', ...args)
    },
    formChange(...args) {
      this.$emit('form-change', ...args)
    },
    submit() {
      this.option.submitLoading && (this.loading = true)
      this.$refs['form'].validate((valid, errObj) => {
        if (valid) {
          this.$emit('submit', this.form, () => (this.loading = false))
          this.$emit('search-change')
        } else {
          this.loading = false
          this.$emit('err', errObj)
        }
      })
    },
    onvalidate(prop, valid, errMsg) {
      this.$emit('validate', prop, valid, errMsg)

      if (this.scrollIntoViewOnValidateLock && this.scrollIntoViewOnValidate && !valid) {
        const { fields } = this.$refs.form
        const field = find(fields, field => field.prop === prop)
        field.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })

        this.scrollIntoViewOnValidateLock = false
      }
    },
    resetForm() {
      this.$refs['form'].resetFields()
      this.$emit('input', this.form)
      this.$emit('reset-change', this.form, () => {})
    },
    resetFields() {
      return this.$refs.form.resetFields()
    },
    async validate(callback) {
      this.scrollIntoViewOnValidateLock = true // 只有手动校验的时候，才会把校验失败的表单子项滚动到可视区域
      this.$nextTick(() => this.scrollIntoViewOnValidateLock = false)

      let { errorMsg } = this
      if (Object.values(errorMsg).some(Boolean)) return false

      return this.$refs.form.validate(callback)
    },
    validateField(field, callback) {
      let { errorMsg } = this
      field = Array.isArray(field) ? field : [field]
      let errors = {}
      field.forEach((prop) => (errors[prop] = errorMsg[prop]))
      if (Object.values(errors).some(Boolean)) {
        if (typeof callback === 'function') {
          field.forEach((prop) => callback(errors[prop] || ''))
        }
        return false
      }

      return this.$refs.form.validateField(field, callback)
    },
    clearValidate(list) {
      this.$nextTick(() => {
        this.errorMsg = {}
        this.$refs.form.clearValidate(list)
      })
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

    getDisplayColumn(column) {
      return (column || []).filter((col) => this.colShowFilterFunction(col))
    },
    getFormItemSlots(column) {
      const { $scopedSlots } = this
      let slots = [
        `${ column.prop }Label`,
        column.formSlotName,
        column.prop,
        'afterFormItem',
        `${ column.prop }After`
      ]
      return slots.filter(name => $scopedSlots[name])
    }
  }
}
</script>
