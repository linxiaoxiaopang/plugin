/* eslint-disable */
import checkAllData from '@/components/base/baseTable/module/checkAllData/checkAll'
import { validData } from '@/components/avue/utils/util'
import { REQUEST_ALL_DATA } from '@/utils/constant'
import { compose } from '@/components/avue/utils/validate'

export default function ({ isHandleRealData: handleRealData } = {}) {
  return {
    components: {
      checkAllData
    },
    props: {
      msgOfSelection: String,
      allDataApi: Function,
      showWarning: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        isCheckAllFromBtn: false, // 点击全选按钮时的全选
        selectionCount: 0,
        getAllDataApi: null
      }
    },
    computed: {
      checkAllAttrs() {
        let {
          checkCurrent,
          checkData,
          tablePage,
          postData,
          selectable,
          isHandleRealData,
          isReserveSelection
        } = this

        let tmpObj = {
          data: checkData,
          total: tablePage.total,
          postData,
          selectable,
          // checkData改变时，改变getAllData
          getAllData: this.getAllData,
          isHandleRealData: validData(isHandleRealData, handleRealData),
          isReserveSelection,
          getInstance: this.getElTableInstance,
          sup_this: this,
          ...this.checkAllProps
        }
        if (checkCurrent) {
          Object.assign(tmpObj, {
            class: 'no-label',
            total: checkData.length,
            allData: checkData,
            getAllData: this.checkCurrentGetAllData,
            isHandleRealData: checkCurrent,
          })
        }
        return tmpObj
      },
      checkCurrent() {
        return false
      },
      checkCurrentGetAllData() {
        return () => this.checkData
      },
      // 如果不操作全部数据，总数只能取接口返回的total
      // 部分情况下，会将接口数据拆分成多条数据，此时tableData无法与total一致
      // 故引入checkable对tableData进行筛选，使tableData与接口total一致
      // 当前页数据：应该与接口返回的数据条数保持一致
      checkData() {
        return this.handleCheckData(this.finalData)
      },
      handleCheckData({ checkable }) {
        return (data) => data.filter(checkable)
      },
      checkable() {
        return () => true
      },

      checkAllListeners() {
        return {
          // 只有isHandleRealData为true时才有这个事件
          selectionChange: (selection) => {
            this.$emit('selection-change', selection)
          },
          selectionCountChange: (selectedTotal) => {
            this.selectionCount = selectedTotal
            this.$emit('selectionCountChange', selectedTotal)
          },
          input: (checked) => !checked && (this.isCheckAllFromBtn = checked),
          checkChange: !this.checkCurrent ? ((checked) => this.isCheckAllFromBtn = checked) : () => {},
          getAllDataLoading: (loading) => {
            this.$emit('checkAllLoading', loading)
          },
          'update:loading': (loading) => {
            this.setLoading(loading, 'checkAll')
          },
          'hook:destroyed': () => {
            this.isCheckAllFromBtn = false
            this.deleteLoading('checkAll') // 不置为false，会导致loading关不掉
          }
        }
      },

      // 会有缓存，api不同时，getAllData需要改变
      getAllData({ allDataApi, getAllDataApi }) {
        if (allDataApi) {
          return () => allDataApi({
            ...this.postData,
            ...REQUEST_ALL_DATA
          })
        }
        if (getAllDataApi) {
          return async () => {
            const detail = await awaitResolveDetail(
              getAllDataApi({
                ...this.postData,
                ...REQUEST_ALL_DATA
              })
            )
            if (!detail) return
            
            return compose(this.handleCheckData, this.handleTableData)(detail)
          }
        }
        return () => compose(this.handleCheckData, this.handlePageData)(this.data || [])
      }
    },
    watch: {
      getList: {
        handler(getList) {
          this.getAllDataApi = getList
        },
        immediate: true
      }
    },
    methods: {
      getSelectionData() {
        if (this.selectionCount === 0) {
          this.showWarning && this.$message.warning(this.msgOfSelection || '请至少选择一条数据')
          return false
        }

        if (!this.$refs.checkAllData) return this.selectionData
        return this.$refs.checkAllData.getSelectionData()
      },
      handleSelectionChange(selection) {
        this.selectionData = selection
        this.selectionCount = selection.length
      },
      handleSelect(selection, row) {
        this.$emit('select', selection, row)
      },
      handleSelectAll(selection) {
        this.$emit('select-all', selection)
      },

      // 在baseTable传入data时，此时不触发init
      // 为了兼容checkAll，重写pageChange已触发after-init
      initOfStaticData() {
        this.getList ? this.init() : this.$emit('after-init', this.finalData, this.tablePage)
      },
      pageChange(e) {
        this.setIsPageChangeTrue()
        this.tablePage.pageIndex = e
        this.initOfStaticData()
      },
      sizeChange(e) {
        this.setIsPageChangeTrue()
        this.tablePage.pageIndex = 1
        this.tablePage.pageSize = e
        this.initOfStaticData()
      },

      handleTableData(data) {
        return data
      },

      // 需要有两个方法：toggleRowSelection、clearSelection
      getElTableInstance() {
        return this.$refs.crud
      }
    }
  }
}
