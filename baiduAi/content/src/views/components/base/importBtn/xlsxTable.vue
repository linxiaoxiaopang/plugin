<template>
  <div class="xlsxContainer">
    <div @click="handleUploadBtnClick">
      <slot>
        <el-button type="primary">上传文件</el-button>
      </slot>
    </div>
    <input :ref="uploadInputId" type="file" :accept="accept" class="c-hide" @change="handkeFileChange" />
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
import { compose } from '@/components/avue/utils/validate'
import { last } from 'lodash'
import { normalizeData, normalizeOptions } from '@/utils/analysis/xlsx'

export default {
  name: 'vue-xlsx-table',
  data() {
    return {
      rawFile: null,
      workbook: null,
      tableData: {
        header: [],
        body: []
      },
      uploadInputId: new Date().getUTCMilliseconds()
    }
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    },
    accept: {
      type: String,
      default: '.xlsx, .xls'
    },
    className: {
      type: String,
      default: 'xlsx-button'
    },
    isMerge: Boolean,
    header: {
      type: Number,
      default: 1
    },
    getHeaderNumber: Function,
    keyMap: Object | Array,
    beforeSelect: {
      type: Function,
      default: () => true
    }
  },
  computed: {
    rABS() {
      const DEFAULT_OPTION = {
        rABS: false
      }
      const xlsxOptions = Object.assign(DEFAULT_OPTION, this.options)
      return xlsxOptions.rABS
    },
    option() {
      const options = {
        default: {
          formatSheet: (workbook) => {
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            this.formatNumToString(sheet)
            let xlsxArr = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
            this.initTable(this.xlsxArrToTableArr(xlsxArr))
          }
        },
        merge: {
          formatSheet: (workbook) => {
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            this.formatNumToString(sheet)
            compose(this.handleInput, this.normalizeData, this.mergeSheetToJson)(sheet)
          }
        }
      }
      if (this.isMerge) return options.merge
      return options.default
    }
  },
  methods: {
    handkeFileChange(e) {
      if (this.rawFile !== null) {
        return
      }
      const loading = this.$loading({
        lock: true,
        text: '上传中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      this.rawFile = e.target.files[0]
      console.log(' this.rawFile ', this.rawFile)
      this.$nextTick(() => {
        this.$emit('getFileName', this.rawFile.name)
      })

      this.fileConvertToWorkbook(this.rawFile)
        .then((workbook) => {
          this.workbook = workbook
          this.option.formatSheet(workbook)
          loading.close()
        })
        .catch((err) => {
          this.$emit('on-select-file', false)
          loading.close()
          console.error(err)
        })
    },
    // formatNumToString(sheet) {
    //   var column_arr = /([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/i.exec(sheet["!ref"]);
    //   const cols = [column_arr[1], column_arr[3]];
    //   const rows = [column_arr[2], column_arr[4]];
    //   if (cols.some((col) => col.length >= 2)) return;
    //   const colsCodes = cols.map((col) => col.charCodeAt(col));
    //   let start = Math.max(2, rows[0]);
    //   for (let i = start; i < rows[1]; i++) {
    //     for (let j = colsCodes[0]; j < colsCodes[1]; j++) {
    //       const key = `${String.fromCharCode(j)}${i}`;
    //       if (
    //         !isNaN(Number(sheet[key] && sheet[key].v)) &&
    //         String(sheet[key] && sheet[key].v).length >= 12
    //       ) {
    //         sheet[key].w = sheet[key].v;
    //       }
    //     }
    //   }
    // },
    formatNumToString(sheet) {
      for (const key in sheet) {
        if (/^[A-Z]+\d+$/.test(key)) {
          let cell = sheet[key]
          if (!isNaN(Number(cell && cell.v)) && String(cell && cell.v).length >= 12) {
            cell.w = cell.v
          }
        }
      }
    },
    mergeSheetToJson(sheet) {
      let header = []
      let data = []

      const column_arr = /([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/i.exec(sheet['!ref'])
      const rows = [Math.max(column_arr[2] - 1, 0), Math.max(column_arr[4] - 1, 0)]
      let startCol = XLSX.utils.decode_col(column_arr[1])
      let endCol = XLSX.utils.decode_col(column_arr[3])
      const range = {
        s: { c: +startCol, r: +rows[0] },
        e: { c: +endCol, r: +rows[1] }
      }
      for (let i = range.s.c; i <= range.e.c; i++) {
        for (let j = range.s.r; j <= range.e.r; j++) {
          let cell = sheet[XLSX.utils.encode_cell({ c: i, r: j })]
          if (!data[j]) data[j] = []
          data[j][i] = { v: cell?.w, rowIndex: j, columnIndex: i }
        }
      }

      const merges = sheet['!merges'] || []
      for (const mergeRange of merges) {
        const sourceCell = data[mergeRange.s.r][mergeRange.s.c]
        for (let i = mergeRange.s.c; i <= mergeRange.e.c; i++) {
          for (let j = mergeRange.s.r; j <= mergeRange.e.r; j++) {
            if (!data[j]) data[j] = []
            data[j][i] = sourceCell
          }
        }
      }

      data = data.filter(item => {
        return item?.some(cell => cell.v !== undefined)
      })

      let { header: headerCount } = this
      if (this.getHeaderNumber) headerCount = this.getHeaderNumber(data)
      if (headerCount) {
        // console.log(headerCount, _.cloneDeep(data))
        header = data.splice(0, headerCount)
        // console.log(headerCount, _.cloneDeep(header))
        header.forEach((row, rowIndex) => {
          return row.forEach((value, colIndex) => {
            value.isHeader = true
            const parent = header[rowIndex - 1]?.[colIndex]
            if (parent) {
              if (!parent.children) parent.children = []
              value.parent = parent
              parent.children.push(value)
            }
          })
        })
        const lastHeader = last(header)
        data.forEach((row) => {
          return row.forEach((value, colIndex) => {
            const parent = lastHeader[colIndex]
            if (parent) {
              if (!parent.children) parent.children = []
              value.parent = parent
              parent.children.push(value)
            }
          })
        })
        return {
          header: header[0],
          body: last(header)
        }
      }

      return {
        header,
        body: data
      }
    },
    fileConvertToWorkbook(file) {
      let reader = new FileReader()
      return new Promise((resolve, reject) => {
        try {
          reader.onload = (renderEvent) => {
            const data = new Uint8Array(renderEvent.target.result)
            const workbook = XLSX.read(data, {
              type: this.rABS ? 'binary' : 'array'
            })
            resolve(workbook)
          }
          reader.onerror = (error) => {
            reject(error)
          }
          if (this.rABS) {
            reader.readAsBinaryString(file)
          } else {
            reader.readAsArrayBuffer(file)
          }
        } catch (error) {
          reject(error)
        }
      })
    },
    xlsxArrToTableArr(xlsxArr) {
      let tableArr = []
      let tempObj = {}
      xlsxArr.forEach((item) => {
        Object.assign(tempObj, item)
      })
      let tableHeader = Object.keys(tempObj)
      let maxLength = tableHeader.length
      let rowItem = {}
      xlsxArr.forEach((item) => {
        rowItem = {}
        for (let i = 0; i < maxLength; i++) {
          if (typeof item[tableHeader[i]] === 'number' || typeof item[tableHeader[i]] === 'string') {
            rowItem[tableHeader[i]] =
              item[tableHeader[i]]
                .toString()
                .replace(/^\s+/, '')
                .replace(/\s+$/, '')
                .replace(/^['‘’]/, '') || ''
          } else {
            rowItem[tableHeader[i]] = item[tableHeader[i]] || ''
          }
        }
        tableArr.push(rowItem)
      })
      return {
        header: tableHeader,
        data: tableArr
      }
    },
    tableArrToXlsxArr({ data, header }) {
      let xlsxArr = []
      let tempObj = {}
      data = data || []
      data.forEach((rowItem) => {
        tempObj = {}
        rowItem.forEach((item, index) => {
          tempObj[header[index]] = item
        })
        xlsxArr.push(tempObj)
      })
      return xlsxArr
    },
    initTable({ data, header }) {
      this.tableData.header = header
      this.tableData.body = data.filter((item) => {
        const key = header.filter((item) => item.indexOf('EMPTY') === -1)[0]
        return item[key]
      })
      this.$emit('on-select-file', this.tableData)
      this.$emit('on-select-all-file', {
        header,
        body: data
      })
    },
    handleInput(value) {
      this.$emit('on-select-file', value)
      this.$emit('on-select-all-file', value)
    },
    handleUploadBtnClick() {
      if (!this.beforeSelect()) return

      this.clearAllData()
      this.$refs[this.uploadInputId].click()
    },
    clearAllData() {
      this.$refs[this.uploadInputId].value = null
      this.tableData = {
        header: [],
        body: []
      }
      this.rawFile = null
      this.workbook = null
    },

    normalizeData(data) {
      // console.log('normalizeData', _.cloneDeep(data))
      const { keyMap } = this
      if (keyMap) {
        const normalizedData = normalizeData(data.header, keyMap)
        // console.log('normalizeData', _.cloneDeep(normalizedData))
        return {
          ...data,
          ...normalizeOptions(normalizedData)
        }
      }
      return data
    }
  }
}
</script>

<style lang="scss" scoped>
.xlsxContainer {
  .c-hide {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    display: none;
  }
}
</style>
