import { initData } from '@/api/data'
import { deepClone, getDiffData, getLabel } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'

const J_TIME_PROPS = ['importTime', 'changeTime', 'deliveryTime', 'exportTime', 'paymentTime']

export default {
  data() {
    return {
      tableLoading: true,
      selectedData: [],
      data: [],
      page: 1,
      size: 10,
      total: 0,
      url: '',
      params: {},
      mergeData: this.resetMergeData || {},
      query: {},
      time: 170,
      initBool: true,
      method: 'post',
      infiniteScroll: false
    }
  },
  mounted() {
    if (this.$refs.paginationBar) {
      this.$refs.paginationBar.pagingInfo.size = this.size
    }
    if (this.initBool) {
      this.init()
    }
  },
  activated() {
    // 第一次加载时会执行activated生命周期
    // deactivated为true时，表示组件已缓存，此时可以执行init更新数据
    if (this.deactivated) {
      this.deactivated = false
      this.refreshPage()
    }
  },
  deactivated() {
    this.deactivated = true
  },
  methods: {
    handleSelectionChange(selection) {
      this.selectedData = selection
    },
    async beforeInit() {
      // 在请求之前执行
      if (this.beforeInitCallback) {
        await this.beforeInitCallback()
      }
      if (!this.url) {
        throw new Error('需要重置url')
      }
      const sort = 'sort'
      let { query, handleSearchFormProps } = this
      this.params = { page: this.page, size: this.size, ordering: sort }
      const tmpObj = {}
      for (let key in query) {
        let value = query[key]
        if (value !== undefined && value !== 'all' && !J_TIME_PROPS.includes(key)) {
          if (handleSearchFormProps) {
            if (handleSearchFormProps[key]) {
              let curVal = handleSearchFormProps[key](value, query)
              if (curVal && curVal.$isMergeData) {
                delete curVal.$isMergeData
                Object.assign(tmpObj, curVal)
              } else {
                tmpObj[key] = curVal
              }
              continue
            }
          }

          tmpObj[key] = value
        }
        if (J_TIME_PROPS.includes(key)) {
          Object.assign(tmpObj, {
            [this.getJavaDirTime(key, 'Start')]: value[0] + ' 00:00:00',
            [this.getJavaDirTime(key, 'End')]: value[1] + ' 23:59:59'
          })
        }
      }
      //排序的空字符串处理
      if (!tmpObj.ordering) {
        tmpObj.ordering = sort
      }
      if (Object.keys(tmpObj).length) {
        const _this = this.$refs.paginationBar
        for (let key in tmpObj) {
          this.params[key] = tmpObj[key]
        }
        _this && _this.reFreshpage && _this.reFreshpage(this.page)
      }

      const { mergeData } = this
      for (let key in mergeData) {
        let value = mergeData[key]
        if (value || value === 0 || value === false) {
          this.params[key] = value
        }
      }

      this.toPostParams()
      return true
    },
    handleSearchForm(query = this.query) {
      let { handleSearchFormProps } = this
      const tmpObj = {}
      for (let key in query) {
        let value = query[key]
        if (value !== undefined && value !== 'all' && !J_TIME_PROPS.includes(key)) {
          if (handleSearchFormProps) {
            if (handleSearchFormProps[key]) {
              let curVal = handleSearchFormProps[key](value, query)
              if (curVal && curVal.$isMergeData) {
                delete curVal.$isMergeData
                Object.assign(tmpObj, curVal)
              } else {
                tmpObj[key] = curVal
              }
              continue
            }
          }

          tmpObj[key] = value
        }
        if (J_TIME_PROPS.includes(key)) {
          Object.assign(tmpObj, {
            [this.getJavaDirTime(key, 'Start')]: value[0] + ' 00:00:00',
            [this.getJavaDirTime(key, 'End')]: value[1] + ' 23:59:59'
          })
        }
      }
      return tmpObj
    },
    toPostParams() {
      if (this.method.toUpperCase() === 'POST') {
        const { page, size, ...rest } = this.params
        const data = {
          page: {
            pageIndex: page,
            pageSize: size
          }
        }
        const params = {}
        Object.assign(params, data, rest)
        let tempObj = {}
        for (const key in params) {
          let value = params[key]
          if (value || value === 0 || value === false) {
            tempObj[key] = value
          }
        }
        this.params = tempObj
      }
    },
    async init() {
      // 组件缓存失活状态不a请求
      if (this.deactivated) return
      // 搜索表单必须放在this.query，为了在搜索表单改变时，将this.page设为1
      let queryDiffData = getDiffData(this.query, this.prevParams || {})
      if (queryDiffData && !this.getIsFirstLoad()) {
        this.page = 1
      }

      if (!(await this.beforeInit())) return
      this.prevParams = deepClone(this.query)

      return new Promise((resolve, reject) => {
        this.tableLoading = true
        this.selectedData = []
        //无限滚动
        if (!this.infiniteScroll) {
          this.data = []
        }

        let apiFunc = initData

        //当遇到detail后端返回值不是一个对象
        if (this.resetInitData) {
          apiFunc = this.resetInitData
        }

        let curRequest = this.lastRequest = apiFunc(this.url, this.method, this.params, this.xMenuType)
          .then((res) => {
            if (!this.infiniteScroll || this.page == 1) {
              // 防止因为前一次请求比最近请求晚响应，导致前一次请求数据覆盖最近请求数据
              if (this.lastRequest !== curRequest) return
              this.lastRequest = null
            }

            this.total = (res.detail && res.detail.count) || (res.page && res.page.total) || 0
            if (this.page == 1) {
              this.data = []
            }
            const resData = this.handleTableData(res.detail)
            if (!this.infiniteScroll) {
              this.data = resData
            } else {
              //无限滚动 data叠加
              this.data = this.data.concat(resData)
            }
            setTimeout(() => {
              this.tableLoading = false
              // 列表数据发生改变，当前页码（大于1）的数据为0，则返回第一页
              if (this.page > 1 && this.data.length === 0) {
                this.page = 1
                this.init()
              }
            }, this.time)
            this.initCallBack && this.initCallBack(res, this.params)
            resolve(res)
          })
          .catch((err) => {
            this.tableLoading = false
            this.initCallBack && this.initCallBack(undefined, this.params)
            reject(err)
          })
      })
    },
    getIsFirstLoad() {
      if(!this.prevParams) return true
      return Object.keys(this.prevParams).length == 0
    },
    handleTableData(detail) {
      return (detail && detail.results) || (Array.isArray(detail) ? detail : [])
    },
    async refreshData() {
      // 组件缓存失活状态不请求
      if (this.deactivated) return

      return new Promise((resolve, reject) => {
        let apiFunc = initData

        //当遇到detail后端返回值不是一个对象
        if (this.resetInitData) {
          apiFunc = this.resetInitData
        }

        let curRequest = this.lastRequest = apiFunc(this.url, this.method, this.params, this.xMenuType)
          .then((res) => {
            // 防止因为前一次请求比最近请求晚响应，导致前一次请求数据覆盖最近请求数据
            if (this.lastRequest !== curRequest) return
            this.lastRequest = null

            // eslint-disable-next-line
            if (!validatenull(res?.detail)) this.data = this.handleTableData(res.detail)
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    refreshPage() {
      this.init()
    },
    searchChange() {
      this.page = 1
      this.init()
    },
    pageChange(e) {
      this.setIsPageChangeTrue()
      this.page = e
      this.init()
    },
    sizeChange(e) {
      this.setIsPageChangeTrue()
      this.page = 1
      this.size = e
      this.init()
    },
    refreshTableEventFun({ page, size }) {
      this.setIsPageChangeTrue()
      this.page = page
      this.size = size
      this.init()
    },
    setIsPageChangeTrue() {
      this.isPageChange = true
      clearTimeout(this.isPageChangeTimer)
    },
    setIsPageChangeFalse() {
      clearTimeout(this.isPageChangeTimer)
      this.$nextTick(function () {
        // console.time('isPageChange')
        this.isPageChangeTimer = setTimeout(() => {
          // console.timeEnd('isPageChange')
          this.isPageChange = false
        }, 500)
      })
    },
    getJavaDirTime(key, fill) {
      return key.replace(/(?=(Time|Date))/, fill)
    },

    getLabel
  }
}
