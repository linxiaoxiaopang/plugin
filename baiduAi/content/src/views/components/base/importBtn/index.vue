<template>
  <span class="analysis-import-dialog-component">
    <XlsxTable v-bind="allXlsxBtnOption" @on-select-file="onSelectFile" @getFileName="getFileName">
      <slot name="xlsxBtn">
        <el-button v-bind="allXlsxBtnOption">{{ allXlsxBtnOption.btnText }}</el-button>
      </slot>
    </XlsxTable>

    <result
      v-if="preview"
      ref="resultEl"
      :data="data"
      :contentCustomClass="contentCustomClass"
      :contentHeight="contentHeight"
      :formOption="formOption"
      v-bind="resultTableOption"
      v-on="$listeners"
    >
      <slot></slot>
    </result>
  </span>
</template>

<script>
import XlsxTable from './xlsxTable'
import result from './importResult'
import {
  xlsxBtnDefaultOption,
  baseTableDefaultOption,
  dialogDefaultOption,
  defaultHandleImportData
} from './const'
import { getSplitAttrs } from '@/utils/component/attrs'
import { isFunction, merge } from 'lodash'

const PREFIX_LIST = {
  xlsx: 'xlsxBtnOption',
  dialog: 'dialogOption',
  body: 'bodyOption',
  default: 'dialog'
}

export default {
  components: { XlsxTable, result },

  props: {
    xlsxBtnConfig: {
      type: Object,
      default: () => ({})
    },

    preview: {
      type: Boolean,
      default: true
    },
    dialogConfig: {
      default: () => ({})
    },

    bodyConfig: {
      type: Object,
      default: () => ({})
    },

    option: {
      type: Object,
      default: () => ({})
    },
    formOption: Object,

    bodyComponentName: {
      default: 'baseTable'
    },

    beforeSelectFile: {
      type: Function,
      default: () => true
    },

    transformKeys: {
      type: Object,
      default: () => ({})
    },

    validImportDataFnc: {
      type: Function,
      default: () => true
    },

    handleImportData: {
      type: Function,
      default: defaultHandleImportData
    },

    showResult: {
      type: Boolean,
      default: true
    },

    checkAll: Boolean,

    contentCustomClass: String,
    contentHeight: {}
  },

  data() {
    return {
      data: {}
    }
  },

  computed: {
    split$Attrs({ $attrs }) {
      return getSplitAttrs($attrs, PREFIX_LIST)
    },

    allXlsxBtnOption({ xlsxBtnConfig, split$Attrs }) {
      return merge({}, xlsxBtnDefaultOption, split$Attrs.xlsxBtnOption, xlsxBtnConfig)
    },

    resultTableOption({ allBodyOption, allDialogOption, bodyComponentName, showResult }) {
      return {
        bodyComponentName,
        showResult,
        bodyOption: allBodyOption,
        dialogOption: allDialogOption
      }
    },

    allDialogOption({ split$Attrs, dialogConfig }) {
      return merge({}, dialogDefaultOption, split$Attrs.dialogOption, dialogConfig)
    },

    allBodyOption({ bodyConfig, split$Attrs, tableOption, checkAll }) {
      return merge({}, baseTableDefaultOption, {
        option: tableOption,
        checkAll
      }, split$Attrs.bodyOption, bodyConfig)
    },

    tableOption({ option }) {
      return {
        menu: false,
        hideOnSinglePage: true,
        ...option,
        column: option.column || this.data.column
      }
    }
  },

  methods: {
    async onSelectFile(excelData) {
      // console.log('excelData', _.cloneDeep(excelData))
      if (!excelData) return this.$message.warning('请使用正确格式模板表格导入')
      if (!excelData.data.length) return this.$message.warning('上传表格无数据')

      const isPass1 = await this.beforeSelectFile(excelData, this)
      if (!isPass1) return

      this.$emit('on-select-file', excelData)

      this.data = excelData
      if (isFunction(this.handleImportData)) {
        const data = await this.handleImportData(excelData)
        if (data) {
          this.data = data
        }
      }

      await this.$nextTick()
      if (this.preview) this.$refs.resultEl.onAppDialogClick()
    },

    getFileName(fileName) {
      this.$emit('getFileName', fileName)
    }
  }
}
</script>

<style scoped lang="scss">
.analysis-import-dialog-component {
  display: inline-block;
}
</style>
