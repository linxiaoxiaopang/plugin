<template>
  <el-checkbox
    class="checkbox-large check-all"
    :value="checkedAll"
    :indeterminate="indeterminate"
    :disabled="loading || !hasSelectableData"
    @change="onchange"
  >
    <slot>
      {{ content }}
    </slot>
  </el-checkbox>
</template>
<script>
import childMixin from '@/components/base/baseTable/mixins/childMixin'
import CacheApi from '@/components/base/baseTable/utils/cacheApi'
import { validatenull, isEqual } from '@/components/avue/utils/validate'
import { combinedAsyncFunc } from '@/components/avue/utils/functional'
import { validData } from '@/components/avue/utils/util'

export default {
  mixins: [childMixin()],
  props: {
    // 必传
    data: {
      type: Array,
      default: () => ([])
    },
    total: Number,
    postData: {
      type: Object,
      default: () => ({})
    },
    rowKey: {
      default: 'id'
    },
    getInstance: Function,
    // 选传
    allData: {
      type: Array,
      default: () => ([])
    },
    getAllData: {
      type: Function,
      default: () => []
    },
    isHandleRealData: Boolean,
    // 是否在搜索条件改变时，保留之前选中的数据
    isReserveSelection: Boolean,
    // 配置
    selectable: {
      type: Function,
      default: () => true
    },
    content: {
      type: String,
      default: '全选'
    }
  },
  data() {
    return {
      loading: false,
      allDataLoading: false,
      curSelectionLoading: false,

      // getAllData返回数据
      allRequestData: [],
      // 全选按钮的值：全选或半选都为true
      checkedAll: false,
      // 非全选时，数据为selectedList
      // 选择列表
      selectedList: [],
      // 全选时，数据为所有数据中排除unselectList的部分
      // 取消选择列表
      unselectList: [],

      isFirstRequested: false
    }
  },
  computed: {
    // indeterminate，控制全选按钮上的 一杠是否显示
    indeterminate() {
      if (this.checkedAll) {
        // 当全选按钮选中时，看看this.unselectList里有没有东西，有的话标识有东西没有选中，则返回true 没有就返回false
        return !!this.unselectList.length
      }
      // 当全选按钮没有选中时，this.selectedList 里有无我们选中的东西
      // 不用判断长度是否等于全部数据，因为一旦等于全部数据this.checkedAll会被设为true
      return !!this.selectedList.length
    },

    totalChange() {
      return {
        total: this.finalTotal,
        selectedTotal: this.selectedTotal,
        nonselectableTotal: this.nonselectableTotal
      }
    },
    finalTotal() {
      return validData(this.total, this.allData?.length, 0)
    },
    selectedTotal() {
      if (this.checkedAll) {
        return this.finalTotal - this.unselectList.length - this.nonselectableTotal
      } else {
        return this.selectedList.length
      }
    },
    nonselectableTotal() {
      return this.nonselectableData.length
    },
    hasSelectableData() {
      return ![0, this.nonselectableTotal].includes(this.finalTotal)
    },

    selectableData() {
      return this.getSelectableData(this.curData)
    },
    // 不可选列表（selectable为false，筛选出来的数据）
    // 不一定是全部的不可选数据，isHandleRealData为true时是，为false时为afterInit后从data筛选出
    nonselectableData() {
      return this.getNonselectableList(this.allRequestData)
    },

    isReal() {
      return this.isHandleRealData || !!this.curAllData
    },
    isReserve() {
      return this.isReserveSelection || !this.isFirstRequested
    },
    selectionData() {
      const selectionData = {
        postDataChange: () => {
          if (!this.isReserve) {
            selectionData.clearSelection()
            this.getAllDataApi.clearAll()
          }
        },
        checkedAllChange: (checkedAll) => {
          if (checkedAll) {
            this.checkedAll = true // 是否会触发el-checkbox的change事件？否
            this.selectedList = []
            this.unselectList = []
            this.listInstance.toggleCurSelection()
          } else {
            selectionData.clearCurSelection()
          }
        },

        addRowSelection: (row) => {
          if (this.loading) return

          if (this.checkedAll) {
            this.pull(this.unselectList, row)
          } else {
            this.push(this.selectedList, row)
          }
        },
        clearRowSelection: (row) => {
          if (this.loading) return

          if (this.checkedAll) {
            this.push(this.unselectList, row)
          } else {
            this.pull(this.selectedList, row)
          }
        },
        clearSelection: () => {
          this.checkedAll = false // 是否会触发el-checkbox的change事件？否
          this.selectedList = []
          this.unselectList = []
          this.listInstance.clearSelection()
        },
        clearCurSelection: () => {
          selectionData.clearSelection()
        },
        updateSelection: (rows) => {
          rows.forEach(selectionData.updateRowSelection)
        },
        updateRowSelection: (row) => {
          if (this.includes(this.selectedList, row)) {
            this.push(this.selectedList, row)
          }
        },

        getCurSelectionData: () => {
          if (this.checkedAll) {
            return this.getAllDataApi.getData()
              .catch(()=>{})
              .then(allData => {
                if (!allData) return

                const { unselectList } = this
                return this.getSelectableData(allData).filter(item => !this.includes(unselectList, item)) || []
              })
          } else {
            return [...this.selectedList]
          }
        },

        isSelectedData: (row) => {
          if (this.checkedAll) {
            return !this.includes(this.unselectList, row) && !this.includes(this.nonselectableData, row)
          } else {
            return this.includes(this.selectedList, row)
          }
        }
      }

      return selectionData
    },
    allSelectionData() {
      let lastAllSelection = []
      let allSelection = [] // 全部选中项
      let curSelection = [] // 当前搜索条件下的选中项

      const allSelectionData = {
        postDataChange: async () => {
          if (this.isReserve) {
            await allSelectionData.changeCurSelection()
            this.listInstance.toggleCurSelection()
          } else {
            allSelectionData.clearSelection()
          }
        },
        checkedAllChange: async (checkedAll) => {
          if (checkedAll) {
            if (this.isReal) {
              await new Promise(resolve => this.$nextTick(resolve)) // 防止阻塞全选样式显示
              await allSelectionData.getCurSelectionData()
              emit()
            }
          } else {
            allSelectionData.clearCurSelection()
          }
        },

        addRowSelection: async (row) => {
          // 在初次请求时，totalChange会清空选中项
          // defaultSelection设置的选中项会被清空
          if (!this.isReserve && (this.curSelectionLoading || this.loading)) return

          this.push(curSelection, row)
          emit()
        },
        clearRowSelection: async (row) => {
          // 在初次请求时，totalChange会清空选中项
          // defaultSelection设置的选中项会被清空
          if (!this.isReserve && (this.curSelectionLoading || this.loading)) return

          this.pull(curSelection, row)
          emit()
        },
        clearSelection: () => {
          const hasSelectionBefore = allSelectionData.hasSelection()
          allSelection = []
          curSelection = []
          this.listInstance.clearSelection()
          hasSelectionBefore && emit()
        },
        clearCurSelection: () => {
          curSelection = []
          emit()
        },
        updateSelection: (rows) => {
          rows.forEach(allSelectionData.updateRowSelection)
        },
        updateRowSelection: (row) => {
          if (this.includes(allSelection, row)) {
            this.push(allSelection, row)
          }
          if (this.includes(curSelection, row)) {
            this.push(curSelection, row)
          }
        },

        changeCurSelection: combinedAsyncFunc(
          async () => {
            this.loading = true
            await this.awaitLoading('curSelectionLoading')
          },
          () => {
            try {
              allSelectionData.hasSelectionThrow()
            } catch (e) {
              // 不清空会导致：全选再取消全选，修改搜索条件，再全选，此时选择的是上一次搜索条件下的全部数据
              this.getAllDataApi.clearAll()
              throw e
            }

            allSelection = allSelectionData.getSelectionData(true)
            curSelection = []
            this.selectionData.clearCurSelection()
            this.getAllDataApi.clearAll()
          },
          // 优化：getData与getCurSelectionData可以同时进行
          this.getAllDataApi.getData,
          () => {
            allSelectionData.hasSelectionThrow()

            // 问题：数据过大
            this.curAllData?.forEach(row => {
              if (this.includes(allSelection, row)) {
                curSelection.push(row)
                this.pull(allSelection, row)
              }
            })

            this.selectedList = this.getSelectableData(curSelection)

            this.loading = false
          }
        ),
        getSelectionData: (isCurrent) => {
          if (!isCurrent) {
            const currentSelection = allSelectionData.getCurSelectionData()
            if (currentSelection instanceof Promise) {
              return currentSelection.then(curSelection => {
                return allSelection.concat(curSelection)
              })
            }
          }

          return allSelection.concat(curSelection)
        },
        getCurSelectionData: () => {
          this.curSelectionLoading = true

          const getCurSelectionData =  (currentSelection) => {
            if (!currentSelection) return

            currentSelection.forEach(row => {
              if (this.selectionData.isSelectedData(row)) {
                this.push(curSelection, row)
              }
            })
            return curSelection
          }

          const currentSelection = this.selectionData.getCurSelectionData()
          if (currentSelection instanceof Promise) {
            return currentSelection
              .then(getCurSelectionData)
              .finally(() => this.curSelectionLoading = false)
          }

          this.curSelectionLoading = false

          return getCurSelectionData(currentSelection)
        },

        hasSelectionThrow: () => {
          if (!allSelectionData.hasSelection()) {
            this.loading = false
            throw '无选中项'
          }
        },
        hasSelection: () => {
          const curAllSelection = allSelectionData.getSelectionData(true)
          return !validatenull(curAllSelection)
        },
        isSelectedData: (row) => {
          return this.includes(allSelectionData.getSelectionData(true),  row)
        }
      }

      const emit = async () => {
        if (this.isReal) {
          // 问题：在elForm中使用时，由于后续为微任务，导致validator中的值为旧值
          // 在curSelectionLoading为false时，使后续执行为同步任务
          if (this.curSelectionLoading) await this.awaitLoading('curSelectionLoading')

          const curAllSelection = allSelectionData.getSelectionData(true)
          if (
            lastAllSelection.length !== curAllSelection.length ||
            lastAllSelection.some((item, index) => !this.isEqual(item, curAllSelection[index]))
          ) {
            lastAllSelection = curAllSelection
            this.$emit('selectionChange', curAllSelection)
            this.$emit('selection-change', curAllSelection)
            this.$emit('curSelectionChange', curSelection)
          }
        }
      }

      return allSelectionData
    },
    getAllDataApi({ getAllData }) {
      const cacheApi = new CacheApi(
        async () => {
          if (!validatenull(this.curAllData)) return this.curAllData

          const currentRequest = this.getAllDataApiLastRequest = getAllData()
          const allData = await currentRequest
          // await new Promise(resolve => setTimeout(resolve, 5000))

          // api改变或不是最新请求时，中断后续操作
          if (getAllData !== this.getAllData || currentRequest !== this.getAllDataApiLastRequest) return

          this.allRequestData = allData
          this.merge(this.allRequestData, this.data)
          return this.allRequestData
        },
        0,
        { isLastRequest: false }
      )
      const { clearAll, init, getData } = cacheApi
      cacheApi.clearAll = () => {
        clearAll()
        this.allRequestData = []
        this.getAllDataApiLastRequest = null
      }
      cacheApi.init = async () => {
        this.getAllDataApiLastRequest = null

        this.$emit('getAllDataLoading', true)
        const res = await init()
        this.$emit('getAllDataLoading', false)
        return res
      }
      cacheApi.getData = async () => {
        return getData()
      }
      return cacheApi
    },
    curData() {
      return validData(this.data, this.allData, [])
    },
    curAllData() {
      if (!validatenull(this.allData)) return this.allData
      if (this.allRequestData.length === this.total) return this.allRequestData
    },

    listInstance() {
      return {
        clearSelection: () => {
          this.getInstance?.()?.clearSelection?.()
        },
        toggleRowSelection: (row, selected) => {
          this.getInstance?.()?.toggleRowSelection?.(row, selected)
        },
        toggleCurSelection: () => {
          this.curData.forEach(row => {
            this.listInstance.toggleRowSelection(row, this.isSelectedData(row))
          })
        }
      }
    }
  },
  watch: {
    postData: {
      handler(n, o) {
        if (!isEqual(n, o, 'page')) {
          this.postDataChange()
        }
      },
      immediate: true
    },

    totalChange: {
      handler({ total, selectedTotal, nonselectableTotal }, { total: oTotal } = {}) {
        if (total !== oTotal) return this.postDataChange()

        if (!this.hasSelectableData) return

        // 这里只改变checkedAll的状态
        const checkedAll = total === (selectedTotal + nonselectableTotal)
        // 只有checkedAll改变时才处理：全选时取消所有选择；checkedAll为false时勾选全部数据
        if (checkedAll !== this.checkedAll) {
          if (checkedAll) { // 为true时，可以直接改变
            this.checkedAllChange(true)
          } else if (selectedTotal === 0) { // false时，只有当selectedTotal为0才处理（全选时取消unselectList的情况）
            this.checkedAllChange(false)
          }
        }
      },
      immediate: true
    },
    selectedTotal: {
      handler(n) {
        // 问题：curSelection中包含不可选数据
        this.$emit('selectionCountChange', n)
      },
      immediate: true
    },

    checkedAll: {
      handler(checkedAll) {
        this.$emit('input', checkedAll)
      },
      immediate: true
    },

    getAllDataApi: {
      handler() {
        this.clearSelection()
        this.allRequestData = []
      },
      immediate: true
    },
    allData: {
      handler() {
        this.clearSelection()
        this.allRequestData = []
      },
      immediate: true
    },
    curData: {
      handler(n) {
        if (!validatenull(n)) this.isFirstRequested = true
        // 更新选中项：防止旧数据缓存，导致校验失败（订单选择物流之后，仍然提示未选择物流）
        this.updateSelection(n)
      },
      immediate: true
    },

    loading: {
      handler(loading) {
        this.$emit('update:loading', loading)
      },
      immediate: true
    },

    sup_this: {
      handler(n, o) {
        [
          ['after-init', this.afterInit],
          ['select', this.handleSelect],
          ['select-all', this.handleSelectAll]
        ].forEach(([name, event]) => {
          this.off(o, name, event)
          this.on(n, name, event)
        })
      },
      immediate: true
    }
  },
  methods: {
    afterInit() {
      this.$nextTick(() => {
        this.listInstance.toggleCurSelection()
      })
      this.push(this.allRequestData, ...this.curData)
    },
    handleSelect(selection, row) {
      console.log(selection, row)
      if (this.includes(selection, row)) {
        this.addRowSelection(row, false)
      } else {
        this.clearRowSelection(row, false)
      }
    },
    handleSelectAll(selection) {
      this.selectableData.forEach(row => {
        this.handleSelect(selection, row)
      })
    },

    onchange(checked) {
      // 全选框为空选( { indeterminate: false, checkedAll: false } )时，checked = true
      // 全选框为半选( { indeterminate: true, checkedAll: true } | { indeterminate: true, checkedAll: false } )时，checked = true
      // 全选框为全选( { indeterminate: false, checkedAll: true } )时，checked = false
      const { indeterminate, checkedAll } = this
      checked = indeterminate || !checkedAll

      this.checkedAllChange(checked)
      this.$emit('checkChange', checked)
    },
    checkedAllChange(checkedAll) {
      this.selectionData.checkedAllChange(checkedAll)
      this.allSelectionData.checkedAllChange(checkedAll)
    },
    postDataChange() {
      this.allSelectionData.postDataChange() // 需要调用selectionData.getCurSelectionData()
      this.selectionData.postDataChange()
    },

    getSelectionData() {
      return this.allSelectionData.getSelectionData()
    },
    // 返回调用方法时当前搜索条件下的选中项
    getCurSelectionData() {
      return this.allSelectionData.getCurSelectionData()
    },
    getSelectedData(data) {
      return data.filter(this.isSelectedData)
    },
    getSelectableData(data) {
      return data.filter(this.selectable)
    },
    getNonselectableList(data) {
      return data.filter(row => !this.selectable(row))
    },

    clearSelection() {
      this.listInstance.clearSelection()
      this.selectionData.clearSelection()
      this.allSelectionData.clearSelection()
    },
    clearCurSelection() {
      this.listInstance.clearSelection()
      this.selectionData.clearCurSelection()
      this.allSelectionData.clearCurSelection()
    },
    // selectionData中存放的是可选择项的选中项，allSelectionData中的是所有选中项（包含不可选择项，其主要来自于外部调用toggleSelection）
    // 优化：selection应该存在allSelectionData，然后将可选择的选中项放入selectionData
    toggleSelection(selection, selected) {
      selection.forEach(row => this.toggleRowSelection(row, selected))
    },
    toggleRowSelection(row, selected = !this.isSelectedData(row)) {
      this[selected ? 'addRowSelection' : 'clearRowSelection'](row)
    },
    addRowSelection(row, isShow = true) {
      if (isShow && this.includes(this.curData, row)) {
        this.listInstance.toggleRowSelection(row, true)
      }

      this.selectionData.addRowSelection(row)
      this.allSelectionData.addRowSelection(row)
    },
    clearRowSelection(row, isShow = true) {
      if (isShow && this.includes(this.curData, row)) {
        this.listInstance.toggleRowSelection(row, false)
      }

      this.selectionData.clearRowSelection(row)
      this.allSelectionData.clearRowSelection(row)
    },
    updateSelection(rows) {
      this.selectionData.updateSelection(rows)
      this.allSelectionData.updateSelection(rows)
    },

    isSelectedData(row) {
      return this.selectionData.isSelectedData(row) || this.allSelectionData.isSelectedData(row)
    },


    awaitLoading(type) {
      if (this[type]) {
        return new Promise(resolve => {
          const unwatch = this.$watch(
            type,
            (loading) => {
              if (!loading) {
                unwatch()
                resolve()
              }
            },
            {
              immediate: true
            }
          )
        })
      }
    },

    intersection(list1, list2) {
      return list1.filter(item => this.includes(list2, item))
    },
    merge(list1, list2) {
      this.push(list1, ...list2)
      return list1
    },
    separate(list1, list2) {
      list2.forEach(item => this.pull(list1, item))
      return list1
    },
    push(list, ...rows) {
      rows.forEach((row) => {
        let index = this.findIndex(list, row)
        if (index > -1) {
          list.splice(index, 1, row)
        } else {
          list.push(row)
        }
      })
      return list
    },
    pull(list, row) {
      const index = this.findIndex(list, row)
      index > -1 && list.splice(index, 1)
      return list
    },
    includes(list, row) {
      return list.some(item => this.isEqual(item, row))
    },
    findIndex(list, row) {
      return list.findIndex(item => this.isEqual(item, row))
    },
    isEqual(data1, data2) {
      if (data1 === data2) return true

      let { rowKey } = this
      return data1[rowKey] === data2[rowKey]
    }
  }
}
</script>
<style lang="scss" scoped>
.checkbox-all-data {
  &.no-label {
    ::v-deep .el-checkbox__label {
      display: none;
    }
  }
}
</style>
