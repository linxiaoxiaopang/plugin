/* eslint-disable */
import { getValueFromObj } from '@/utils'
import { REQUEST_ALL_DATA } from '@/utils/constant'
import { handleSelectionData, validateSelectionData, getSelectionData } from '@/views/components/checkAllData3/utils'
import checkAllData from '@/views/components/checkAllData3'
import { initData } from '@/api/data'
import { deepClone, getDiffData } from '@/components/avue/utils/util'

let elTableInstance = {
  checkbox: 'elTableInstance',
  avueCrud: '$refs.crud.$refs.table',
  table: '$refs.table'
}
export default function ({ type = 'avueCrud', apiType = type, isHandleRealData } = {}) {
  return {
    components: {
      checkAllData
    },
    data() {
      return {
        requestData: [],
        checkedList: [],
        checkAllStatus: '',
        checkAllFinalData: {
          selectionDataAll: [],
          selectionDataAllArr: []
        },
        selectionDataAll: [],
        selectionDataAllArr: [],
        selectionCount: 0,
  
        // 当前页全选
        curPageIndeterminate: false,
        curPageCheckedAll: false
      }
    },
    computed: {
      checkAllAttrs() {
        let {
          page,
          size,
          total,
          tablePage = {
            pageIndex: page,
            pageSize: size,
            total: total
          },
          selectable,
          selectedData,
          data,
          requestData = data,
          selectionData = selectedData
        } = this
        return {
          selectable,
          selectionData,
          isHandleRealData,
          tableData: requestData,
          page: tablePage.pageIndex,
          size: tablePage.pageSize,
          total: tablePage.total,
          isPageChange: this.isPageChange,
          setIsPageChangeFalse: this.setIsPageChangeFalse,
          getAllData: this.getAllData,
          getElTableInstance: this.getElTableInstance
        }
      },
      checkAllListeners() {
        return {
          checkAllStatus: this.checkAllStatusChange,
          selectionChange: this.selectionChange,
          selectionCountChange: this.selectionCountChange
        }
      },
      elTableInstance() {
        return {
          toggleAllSelection: () => {
            this.checkedList = this.tableData.map((i, index) => index)
            this.handleCheckedChange(this.checkedList)
          },
          toggleRowSelection: (row, selected) => {
            if (selected) {
              let index = this.tableData.findIndex((item) => item.id === row.id)
              if (!this.checkedList.includes(index) && index > -1) {
                this.checkedList.push(index)
              }
            }
            this.handleCheckedChange(this.checkedList)
          },
          clearSelection: () => {
            this.checkedList = []
            this.handleCheckedChange(this.checkedList)
          }
        }
      },
      getAllDataApi() {
        if (['checkbox', 'avueCrud'].includes(apiType)) {
          return () => {
            return this.getList({
              ...this.postData,
              ...REQUEST_ALL_DATA
            })
          }
        } else if (apiType === 'table') {
          return () => {
            return initData(this.url, this.method, {
              ...this.params,
              ...REQUEST_ALL_DATA
            })
          }
        }
      }
    },
    watch: {
      selectionDataAll: {
        handler(n) {
          this.checkAllFinalData.selectionDataAll = n
        },
        immediate: true,
        deep: true
      },
      selectionDataAllArr: {
        handler(n) {
          this.checkAllFinalData.selectionDataAllArr = n
        },
        immediate: true,
        deep: true
      }
    },
    methods: {
      validateSelectionData,
      
      handleDialogOpen(param, dialogRefName) {
        return this.handleSelectionData(param, this.$refs[dialogRefName].dialogOpen)
      },
      async getSelectionData(row) {
        let getSelectionData = await this.handleSelectionData(row)
        if (!getSelectionData) return
        return getSelectionData()
      },
      handleSelectionData(param, callback) {
        return handleSelectionData(this, param, callback)
      },
      handleCheckedChange(value) {
        let { tableData } = this
        let tempArr = []
        value.forEach((i) => {
          tempArr.push(tableData[i])
        })
        // console.log(tempArr)
        this.handleSelectionChange(tempArr)
    
        // 当前页全选
        if (this.tableData.length) {
          let checkedCount = value.length
          this.curPageCheckedAll = checkedCount === this.tableData.length
          this.curPageIndeterminate = checkedCount > 0 && checkedCount < this.tableData.length
        }
      },
      
      initCallBack(res, postData) {
        this.checkAllInitCallBack(res, postData)
      },
      afterInit(res, postData) {
        this.checkAllInitCallBack(res, postData)
      },
      checkAllInitCallBack(res, postData) {
        let { oPostData } = this
        if (oPostData?.page?.pageIndex && postData?.page?.pageIndex) oPostData.page.pageIndex = postData.page.pageIndex
        if (getDiffData(postData, oPostData) || getDiffData(oPostData, postData)) this.oAllData = null
        // console.log(this.postData, this.oPostData)
        // console.log(getDiffData(postData, oPostData))
        // console.log(getDiffData(oPostData, postData))
        this.oPostData = deepClone(postData)
        
        let requestData = res?.detail || []
        this.requestData = requestData
        let initCallBack = getValueFromObj(this.$refs.checkAllData, 'initCallBack')
        if (initCallBack) initCallBack(requestData, postData?.page?.pageIndex)
        this.checkedList = []
      },
      checkAllStatusChange(status) {
        this.checkAllStatus = status
        // console.log(this.selectionDataAllArr)
      },
      selectionChange(selectionDataAllArr) {
        this.selectionDataAll = selectionDataAllArr
        this.selectionDataAllArr = selectionDataAllArr.map(({ id }) => id)
        this.checkAllFinalData.selectionDataAll = selectionDataAllArr
        this.checkAllFinalData.selectionDataAllArr = selectionDataAllArr.map(({ id }) => id)
      },
      selectionCountChange(selectionCount) {
        this.selectionCount = selectionCount
      },
      async getSelectionDataAllArr() {
        let tempArr = await this.$refs.checkAllData.getSelectionDataAllArr()
        this.selectionDataAllArr = tempArr.map(({ id }) => id)
        // console.log(tempArr)
        return tempArr
      },
      async getAllData() {
        if (this.oAllData) return this.oAllData
        let res = await awaitResolve(this.getAllDataApi())
        res = res?.detail
        if (!res) {
          this.$message.warning('获取数据失败，请重试')
          return
        }
        return this.oAllData = res
      },
      getElTableInstance() {
        return getValueFromObj(this, elTableInstance[type])
      }
    },
    provide() {
      return {
        getSelectionData: async (type) => {
          let selectionDataAllArr = await this.getSelectionDataAllArr()
          return type === 'full' ? this.selectionDataAll : selectionDataAllArr
        },
        checkAllFinalData: this.checkAllFinalData
      }
    }
  }
}
