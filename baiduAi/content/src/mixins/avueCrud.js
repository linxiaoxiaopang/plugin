/* eslint-disable */
import { validatenull } from '@/components/avue/utils/validate'
import { findByvalue, getDiffData, getLabel, getObjType, vaildData } from '@/components/avue/utils/util'
import { parseCharacterTime } from '@/utils'
import { camelCase, isNumber } from 'lodash'

export default function (option = {}) {
  let { getList, tableOption = {}, isInit = true, isInfiniteScroll } = option
  const { page: hasPage } = tableOption || {}

  // let lastRequest // 不同的avueCrud 在同一个页面会使用同一个 lastRequest
  return {
    data() {
      tableOption.column && this.$store.dispatch('HandleOption', tableOption)
      return {
        tableOption,
        tableData: [],
        tablePage: {
          pageIndex: 1,
          pageSize: 10,
          total: 0
        },
        tableLoading: false,
        selectionData: [],
        isPageChange: false,
        searchForm: {},
        postData: {},
        afterInitFns: []
      }
    },
    computed: {
      page({ tablePage: { pageIndex, pageSize } }) {
        if (hasPage === false) return {}
        return {
          page: {
            pageIndex,
            pageSize
          }
        }
      },

      noMore({ tablePage: { pageIndex, pageSize, total } }) {
        if (!this.isLoaded) return false
        return pageIndex * pageSize >= total
      }
    },
    created() {
      if (getList && !this.getList) {
        this.getList = getList
      }
      isInit && this.init()
    },
    mounted() {
      this.updateSearch()
    },
    updated() {
      this.updateSearch()
    },
    activated() {
      // 第一次加载时会执行activated生命周期
      // deactivated为true时，表示组件已缓存，此时可以执行init更新数据
      if (this.deactivated) {
        this.refreshPage()
      }
    },
    deactivated() {
      this.deactivated = true
    },
    methods: {
      getLabel,
      findByvalue,
      vaildData(val, defaultVal = '暂无') {
        return vaildData(val, defaultVal)
      },
      beforeInit() {},
      async init() {
        if (this.getList) {
          this.getPostData()
          this.beforeInit() // 在 getPostData 之后执行，对 postData 操作
          this.tableLoading = true

          let { initFn } = this
          if (isInfiniteScroll) {
            initFn = this.infiniteScrollInitFn
          }
          let { res, postData } = (await initFn()) || {}

          this.afterInitFns.forEach(fn => {
            typeof fn === 'function' && fn(res, postData)
          })
          this.afterInitFns = []

          this.afterInit(res, postData)
          return res
        }
      },
      async initFn() {
        let res
        let detail
        let postData = this.postData
        try {
          this.tableData = []
          let curRequest = this.lastRequest = this.getList(postData)
          res = await this.lastRequest
          // 防止因为前一次请求比最近请求晚响应，导致前一次请求数据覆盖最近请求数据
          if (this.lastRequest !== curRequest) return
          this.lastRequest = null

          detail = res?.detail || []

          // 列表数据发生改变，当前页码（大于1）的数据为0，则返回第一页
          if (this.tablePage.pageIndex > 1 && !detail?.length) {
            this.tablePage.pageIndex = 1
            return this.init()
          }

          this.tableData = this.handleTableData(detail)
          this.tablePage.total = res.page.total
        } catch (e) {
          this.tableData = []
          console.log(e)
        }

        this.tableLoading = false
        return {
          res,
          postData
        }
      },
      async infiniteScrollInitFn() {
        let res
        let detail
        let postData = this.postData
        try {
          res = await this.getList(postData)

          detail = res?.detail || []

          this.tableData = this.tableData.concat(detail)
          this.tablePage.total = res.page.total
        } catch (e) {
          console.log(e)
        }

        this.tableLoading = false
        return {
          res,
          postData
        }
      },
      async initRequest() {
        try {
          let curRequest = this.lastRequest = this.getList(this.postData)
          let res = await curRequest

          // 防止因为前一次请求比最近请求晚响应，导致前一次请求数据覆盖最近请求数据
          if (this.lastRequest !== curRequest) return
          this.lastRequest = null

          return res
        } catch (e) {
          console.log(e)
        }
      },
      async onload() {
        // console.log('onload', this.noMore, this.isLoaded, this.lastRequest)
        if (this.noMore) return
        this.isLoaded = true
        if (this.lastRequest) {
          await this.lastRequest
          return this.onload()
        }
        this.tablePage.pageIndex += 1
        this.lastRequest = this.init()
        await this.lastRequest
        this.lastRequest = null
      },
      handleTableData(data) {
        return data
      },
      afterInit() {},
      async refreshData() {
        let res = await this.initRequest()

        // eslint-disable-next-line
        if (!validatenull(res?.detail)) this.tableData = this.handleTableData(res.detail)
      },
      async refreshPage() {
        await this.init()
      },
      emptyInit() {
        this.tableData = []
        return this.init()
      },
      searchChange() {
        this.tablePage.pageIndex = 1
        this.init()
      },
      pageChange(e) {
        this.setIsPageChangeTrue()
        this.tablePage.pageIndex = e
        this.init()
      },
      sizeChange(e) {
        this.setIsPageChangeTrue()
        this.tablePage.pageIndex = 1
        this.tablePage.pageSize = e
        this.init()
      },
      async refreshTableEventFun({ page, size }) {
        this.setIsPageChangeTrue()
        this.tablePage.pageIndex = page
        this.tablePage.pageSize = size
        await this.init()
      },
      updateSearch() {
        if (typeof this.searchUnwatch === 'function') return
        this.searchUnwatch = this.$refs.crud?.$watch(
          'searchForm',
          (n) => {
            this.searchForm = n
          },
          { immediate: true }
        )
      },
      rowAdd() {
        this.$refs.crud.rowAdd()
      },
      setIsPageChangeTrue() {
        this.isPageChange = true
        clearTimeout(this.isPageChangeTimer)
      },
      setIsPageChangeFalse() {
        clearTimeout(this.isPageChangeTimer)
        this.$nextTick(function () {
          this.isPageChangeTimer = setTimeout(() => (this.isPageChange = false), 500)
        })
      },
      handleSelectionChange(selection) {
        this.selectionData = selection
      },
      getJavaDirTime(key, fill) {
        return key.replace(/(?=(Time|Date))/, fill)
      },
      handleSearchTime(key, value) {
        if (!Array.isArray(value)) return { [key]: value }
        let searchTime

        let startTime = value[0]
        if (startTime?.split(' ').length < 2) startTime = `${startTime} 00:00:00`
        let endTime = value[1]
        if (endTime?.split(' ').length < 2) endTime = `${endTime} 23:59:59`

        if (/Time|Date/.test(key)) {
          searchTime = {
            [this.getJavaDirTime(key, 'Start')]: startTime,
            [this.getJavaDirTime(key, 'End')]: endTime
          }
        }
        if (/_time|_date/.test(key)) {
          searchTime = {
            [camelCase(`start ${key}`)]: parseCharacterTime(new Date(`${startTime}`)),
            [camelCase(`end ${key}`)]: parseCharacterTime(new Date(`${endTime}`))
          }
        }
        return searchTime
      },
      handleSearchForm(searchForm = this.searchForm) {
        let form = {}
        let lastMergeData = []
        let { handleSearchTime, handleSearchFormProps } = this
        for (const key in searchForm) {
          let value = searchForm[key]
          if (!validatenull(value) && value !== 'all') {
            if (/Time|Date|_time|_date/.test(key)) {
              Object.assign(form, handleSearchTime(key, value))
              continue
            }
            if (handleSearchFormProps) {
              if (handleSearchFormProps[key]) {
                value = handleSearchFormProps[key](value, form)
                if (!validatenull(value)) {
                  if (value && isNumber(value.$lastMergeData)) {
                    lastMergeData.splice(value.$lastMergeData, 0, value)
                    delete value.$lastMergeData
                  } if (value && value.$isMergeData) {
                    delete value.$isMergeData
                    this.formAssign(form, value)
                  } else {
                    form[key] = value
                  }
                }
                continue
              }
            }

            form[key] = value
          }
        }
        lastMergeData.filter(Boolean).forEach(mergeData => this.formAssign(form, mergeData))
        return form
      },
      formAssign(form, ...args) {
        const firstPriority = getObjType(form.$firstPriority) === 'object' ? form.$firstPriority : {}
        args.forEach(item => {
          getObjType(item.$firstPriority) === 'object' && Object.assign(firstPriority, item.$firstPriority)
          Object.assign(form, item)
        })
        form.$firstPriority = firstPriority
        return form
      },
      getPostData() {
        let searchForm = this.handleSearchForm()

        let queryDiffData = getDiffData(searchForm, this.postData)
        //第一次加载 不重置pageIndex
        if (queryDiffData && !this.getIsFirstLoad()) {
          this.tablePage.pageIndex = 1
        }
        const postData = this.handlePostData(
          {
            ...this.page,
            ...searchForm,
            // 不能直接在data里添加，方便设置为computed
            ...(this.resetMergeData || {}),
            // 最高优先级
            ...(searchForm.$firstPriority || {})
          },
          searchForm
        )
        delete searchForm.$firstPriority
        delete postData.$firstPriority
        this.params = this.postData = postData
      },

      getIsFirstLoad() {
        if(!this.postData) return true
        return Object.keys(this.postData).length == 0
      },

      handlePostData(data) {
        return data
      },

      success() {
        this.$message.success('操作成功')
        this.init()
      }
    }
  }
}
