/* eslint-disable */
import eventMixin from './event'
import { validatenull } from '@/components/avue/utils/validate'
import { findByvalue, validateDiffData, getLabel, vaildData } from '@/components/avue/utils/util'
import { parseCharacterTime } from '@/utils'
import { camelCase, isString } from 'lodash'

export default function (option = {}) {
  let { getList, tableOption = {}, isInit = true, isInfiniteScroll } = option
  const { page: hasPage } = tableOption || {}

  // let lastRequest // 不同的avueCrud 在同一个页面会使用同一个 lastRequest
  return {
    mixins: [ eventMixin('resize') ],
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
        loadings: {},
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

      tableLoading: {
        get({ loadings }) {
          // loadings.own为true即可开启loading
          if (loadings.own) return this.isLoading = true

          // 全部为false，才能关闭loading
          if (this.isLoading) return this.isLoading = Object.values(loadings).some(Boolean)

          return loadings.own
        },
        set(loading) {
          this.$set(this.loadings, 'own', loading)
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
          this.beforeInit()
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

          this.afterInit(res, postData, this.tableData)
          this.$emit('after-init', res, postData)
          return res
        }
      },
      async initFn() {
        let res
        let detail
        let postData = this.postData
        this.tableData = []
        try {
          let curRequest = this.lastRequest = this.getList(postData)
          res = await this.lastRequest
          // 防止因为前一次请求比最近请求晚响应，导致前一次请求数据覆盖最近请求数据
          if (this.lastRequest !== curRequest) return
          this.lastRequest = null

          detail = this.handleTableData(res?.detail || [])
          if (isString(detail)) return

          // 列表数据发生改变，当前页码（大于1）的数据为0，则返回第一页
          if (this.tablePage.pageIndex > 1 && !detail?.length) {
            this.tablePage.pageIndex = 1
            return this.init()
          }

          this.tableData = detail
          this.tablePage.total = res?.page?.total
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
          this.tablePage.total = res?.page?.total
        } catch (e) {
          console.log(e)
        }

        this.tableLoading = false
        return {
          res,
          postData
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
      setLoading(loading, key = 'own') {
        this.$set(this.loadings, key, loading)
      },
      deleteLoading(key = 'own') {
        this.$delete(this.loadings, key)
      },
      refreshPage() {
        return this.init()
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
      // createTime -> createStartTime, createEndTime
      // create_time -> startCreateTime, endCreateTime
      handleSearchTime(key, value) {
        if (!(Array.isArray(value) && value.filter(Boolean).length === 2)) return { [key]: value }
        let searchTime

        let startTime = value[0]
        if (startTime.split(' ').length < 2) startTime = `${startTime} 00:00:00`
        let endTime = value[1]
        if (endTime.split(' ').length < 2) endTime = `${endTime} 23:59:59`

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
      handleSearchForm() {
        let form = {}
        let { searchForm, handleSearchTime, handleSearchFormProps } = this
        for (const key in searchForm) {
          let value = searchForm[key]
          if (!validatenull(value) && value !== 'all') {
            if (handleSearchFormProps) {
              if (handleSearchFormProps[key]) {
                value = handleSearchFormProps[key](value, form)
                if (!validatenull(value)) {
                  if (value && value.$isMergeData) {
                    delete value.$isMergeData
                    Object.assign(form, value)
                  } else {
                    form[key] = value
                  }
                }
                continue
              }
            }
            if (/Time|Date|_time|_date/.test(key)) {
              Object.assign(form, handleSearchTime(key, value))
              continue
            }

            form[key] = value
          }
        }
        return form
      },
      getPostData() {
        let searchForm = this.handleSearchForm()

        const postData = this.handlePostData(
          {
            ...(this.mergeData || {}),
            ...this.page,
            ...searchForm,
            // 不能直接在data里添加，方便设置为computed
            ...(this.resetMergeData || {})
          },
          searchForm
        )

        // 搜索表单改变之后，需要返回第一页，因为数据总数可能会变少，导致页数减少
        let queryDiffData = validateDiffData(postData, this.postData, ['page'])
        //第一次加载 不重置pageIndex
        if (queryDiffData && !this.getIsFirstLoad()) {
          postData.page.pageIndex = this.tablePage.pageIndex = 1
        }
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
      },
      onresize() {
        this.$nextTick(function () {
          this.$refs.crud?.doLayout()
        })
      }
    }
  }
}
