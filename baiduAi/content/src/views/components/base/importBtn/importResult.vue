<template>
  <appDialog
    ref="appDialogEl"
    :beforeOpen="onBeforeOpen"
    @open="onopen"
    @closed="onclosed"
    @submit="onsubmit"
    v-bind="dialogOption"
    v-on="new$listeners"
  >
    <template>
      <slot :data="data" :tableData="tableData">
        <div class="content" :class="[contentCustomClass]" :style="contentStyle">
          <TotalResult
            v-if="showResult"
            :data="tableData"
            :errData="errData"
          />

          <component
            :is="bodyComponentName"
            :data="tableData"
            :defaultSelection="defaultSelection"
            :sup_this="sup_this"
            v-bind="bodyOption"
          ></component>

          <baseForm v-if="formOption" ref="form" class="mt20" v-model="form" :option="formOption"></baseForm>
        </div>
      </slot>
    </template>
  </appDialog>
</template>

<script>
import baseTable from '@/components/base/baseTable/mixins/baseTable'
import TotalResult from './totalResult'
import { fillValidErrorPassColumnInData } from '@/utils/validate/data'
import { validatenull } from '@/components/avue/utils/validate'
import { setPx, validData } from '@/components/avue/utils/util'
import { isFunction, isNil } from 'lodash'

export default {
  components: {
    TotalResult
  },

  mixins: [baseTable],

  props: {
    data: {
      type: Object,
      default: () => ({})
    },

    dialogOption: {
      type: Object,
      default: () => ({})
    },

    bodyOption: {
      type: Object,
      default: () => ({})
    },

    bodyComponentName: {
      default: 'baseTable'
    },

    showResult: {
      type: Boolean,
      default: true
    },

    contentCustomClass: String,
    contentHeight: {},

    formOption: Object
  },

  data() {
    return {
      sup_this: this,
      defaultSelection: [],
      errData: [],
      form: {}
    }
  },

  computed: {
    tableData() {
      return this.data.data
    },

    new$listeners({ $listeners }) {
      const { submit, ...new$listeners } = $listeners
      return new$listeners
    },

    column({ bodyOption }) {
      return $GET(bodyOption, 'option.column', [])
    },

    checkAll({ bodyOption }) {
      return bodyOption.checkAll
    },

    contentStyle({ contentHeight }) {
      const style = {}
      if (!isNil(contentHeight)) {
        style.height = setPx(contentHeight)
      }
      return style
    }
  },

  methods: {
    async onsubmit(data, done) {
      if (!await this.validate()) return done(false)

      if (!this.$listeners.submit) {
        return done(true)
      }

      const importData = await this.getImportData()
      this.$emit('submit', importData, done, this)
    },
    async validate() {
      if (!this.tableData?.length) {
        this.$message.warning('无可导入数据')
        return
      }

      const importData = await this.getImportData()
      if(validatenull(importData)) return

      const existErrItem = importData.some(item => item.asyncValidatorErrorList)
      if (existErrItem) {
        this.$message.warning('存在异常的数据')
        return
      }

      const form = this.$refs.form
      if (form) return awaitFormResolve(form.validate())

      return true
    },
    async getImportData() {
      let importData = this.tableData
      if (this.checkAll) {
        importData = await this.getSelectionData()
      }
      return importData
    },

    async onBeforeOpen() {
      if (isFunction(this.dialogOption?.beforeOpen)) {
        const isPass = await this.dialogOption?.beforeOpen(this.tableData, this)
        if (!isPass) return
      }
      if (this.checkAll) {
        this.defaultSelection = [...this.tableData]
      }
      return true
    },

    async onopen() {
      const fillValidErrorHandleData = validData(this.dialogOption?.fillValidErrorHandleData, this.defaultFillValidErrorHandleData)
      if (isFunction(fillValidErrorHandleData)) return fillValidErrorHandleData(this.tableData, this)
    },

    onclosed() {
      this.defaultSelection = []
      this.form = {}
    },

    async defaultFillValidErrorHandleData() {
      const res = await fillValidErrorPassColumnInData(this.column, this.tableData, { isAsync: true })
      this.errData = res.filter(item => !validatenull(item.errors))
      return true
    },

    onAppDialogClick() {
      this.$refs.appDialogEl.onclick()
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex-direction: column;
  height: 50vh;
}
</style>
