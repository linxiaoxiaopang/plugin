<template>
  <el-checkbox
    :class="{ 'checkbox-large': cSize === 'medium' }"
    :indeterminate="checkAllStatus === 'indeterminate'"
    :disabled="selectableTotal === 0"
    :value="checkAllStatus === 'all'"
    @change="checkAllChange"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot>
      {{ content }}
    </slot>
  </el-checkbox>
</template>
<script>
import { accSub } from '@/utils'

export default {
  props: {
    cSize: {
      type: String,
      default: 'medium'
    },
    content: {
      type: String,
      default: '全选'
    },
    value: {
      type: Boolean,
      default: false
    },
    tableData: {
      type: Array,
      default: () => ([])
    },
    page: {
      type: Number,
      default: 1
    },
    size: {
      type: Number,
      default: 10
    },
    total: {
      type: Number,
      default: 0
    },
    isPageChange: {
      type: Boolean,
      default: false
    },
    setIsPageChangeFalse: {
      type: Function,
      default: () => {}
    },
    getAllData: {
      type: Function,
      default: () => {}
    },
    getElTableInstance: {
      type: Function,
      default: () => {}
    },
    selectable: {
      type: Function,
      default: () => true
    },
    selectionData: {
      type: Array,
      default: () => ([])
    },
    isHandleRealData: Boolean
  },
  data() {
    return {
      curTotal: 0,
      // 所有不允许选择项
      disabledDataAll: {},
      // 所有选择项
      selectionDataAll: {},
    }
  },
  computed: {
    selectionDataAllArr({ selectionDataAll }) {
      let tempArr = []
      for (const key in selectionDataAll) {
        tempArr = tempArr.concat(selectionDataAll[key])
      }
      this.$emit('selectionChange', tempArr)
      this.$emit('selectionCountChange', tempArr.length)
      return tempArr
    },
    checkAllStatus({ selectableTotal, selectionDataAllArr }) {
      // console.log(selectionDataAllArr, selectableTotal)
      if (selectableTotal === 0) return
      let selectedDataLen = selectionDataAllArr.length
      if (selectedDataLen < selectableTotal && selectedDataLen > 0) return 'indeterminate'
      if (selectedDataLen === selectableTotal) return 'all'
    },
    disabledDataAllArr({ disabledDataAll }) {
      let tempArr = []
      for (const key in disabledDataAll) {
        tempArr = tempArr.concat(disabledDataAll[key])
      }
      // this.$emit('selection-change', tempArr)
      return tempArr
    },
    selectableTotal({ curTotal, disabledDataAllArr }) {
      // console.log(curTotal, disabledDataAllArr.length)
      return accSub(curTotal, disabledDataAllArr.length)
    }
  },
  watch: {
    selectionData: {
      handler(n) {
        // console.log(n)
        // 请求超过500全选失效
        // this.setIsPageChangeFalse()
        if (!this.isPageChange) {
          this.$set(this.selectionDataAll, this.page, n)
        }
      },
      immediate: true,
      deep: true
    },
    checkAllStatus: {
      handler(n) {
        // console.log(n)
        this.$emit('checkAllStatus', n)
      }
    },

    value: {
      handler(n) {
        // console.log('value', n)
        this.$nextTick(function () {
          this.selectedAllChange(n)
        })
      },
      immediate: true
    },
    size: {
      handler() {
        this.disabledDataAll = {}
        this.$nextTick(function () {
          this.selectedAllChange(false)
        })
      },
      immediate: true
    },
    total: {
      handler(n) {
        this.disabledDataAll = {}
        this.curTotal = n
        this.$nextTick(function () {
          this.selectedAllChange(false)
        })
      },
      immediate: true
    }
  },
  methods: {
    async getSelectionDataAllArr() {
      let { selectionDataAll, size, checkAllStatus } = this

      let allTableData = []
      let hasPlaceholderData = false
      for (const key in selectionDataAll) {
        if (this.isPlaceholderData(selectionDataAll[key])) {
          hasPlaceholderData = true
          break
        }
      }
      if (hasPlaceholderData) {
        allTableData = await this.getAllData()
        if (!allTableData) return
        // if (checkAllStatus === 'all') return this.getCanSelectionData(allTableData)
      }

      // 放hasPlaceholderData外面，不然tempArr取不到值
      let tempArr = []
      for (const key in selectionDataAll) {
        let curSelectionData = selectionDataAll[key]
        if (this.isPlaceholderData(curSelectionData)) {
          curSelectionData = selectionDataAll[key] = allTableData.slice((key - 1) * size, key * size)
        }
        tempArr = tempArr.concat(curSelectionData)
      }

      return this.getCanSelectionData(tempArr)
    },
    isPlaceholderData(data) {
      return data && data.length && data[0] === undefined
    },

    async checkAllChange(checked) {
      // console.log('checkAllChange', checked)
      this.selectedAllChange(checked)
      if (checked) {
        // let allTableData = await this.getAllData()
        let { size, total } = this
        let selectionDataAll = {}
        let len = Math.ceil(total / size)
        for (let i = 1; i < len; i++) {
          selectionDataAll[i] = []
          selectionDataAll[i].length = size
        }
        selectionDataAll[len] = []
        selectionDataAll[len].length = total % size || size
        this.selectionDataAll = selectionDataAll
        // console.log(selectionDataAll)

        if (this.isHandleRealData) this.getSelectionDataAllArr()
      }
    },
    selectedAllChange(checked) {
      // console.log(checked)
      let elTableInstance = this.getElTableInstance()
      if (!elTableInstance) return
      if (checked) {
        this.$nextTick(function () {
          // elTableInstance.toggleAllSelection()
          this.toggleSelection(this.tableData, true)
        })
      } else {
        this.selectionDataAll = {}
        // this.disabledDataAll = {} // 只有列表数据发生变化时才重置
        this.$nextTick(function () {
          elTableInstance.clearSelection()
        })
      }
      this.$emit('change', checked)
    },
    toggleSelection(rows, selected) {
      let { tableData } = this
      let elTableInstance = this.getElTableInstance()
      if (!elTableInstance) return
      if (rows) {
        rows = this.getCanSelectionData(rows)
        rows.forEach(({ id }) => {
          let row = tableData.find(row => row.id === id)
          // console.log(row)
          if (row) elTableInstance.toggleRowSelection(row, selected)
        })
      } else {
        elTableInstance.clearSelection()
      }
    },

    // 回显，表格改变时设置选中项
    initCallBack(tableData, page) {
      // console.log(this.getSelectionDataAllArr())
      this.$nextTick(function () {
        if (this.isPageChange) {
          this.setIsPageChangeFalse()
          let { selectionDataAll } = this
          let curSelectionData = selectionDataAll[page]
          if (this.isPlaceholderData(curSelectionData)) {
            curSelectionData = this.getCanSelectionData(tableData)
            this.$set(selectionDataAll, page, curSelectionData)
          }
          this.toggleSelection(curSelectionData, true)
        } else {
          // console.log('initCallBack', false)
          this.selectedAllChange(false)
        }

        // if (!this.isPageChange) this.disabledDataAll = {}
        let { disabledDataAll } = this
        this.$set(disabledDataAll, page, [])
        tableData.forEach(row => {
          // console.log(this.selectable(row))
          if (!this.selectable(row)) {
            disabledDataAll[page].push(row)
          }
        })
        // console.log(tableData[0]?.orderCode, disabledDataAll, page)
      })
    },

    getCanSelectionData(data) {
      // console.log(data, data.filter(this.selectable))
      return data.filter(this.selectable)
    }
  }
}
</script>
