<template>
  <avue-crud
    ref="crud"
    class="base-table"
    :class="{ 'flex-one-page': finalOption.isOnePage }"
    :height="finalHeight"
    :search.sync="searchForm"
    :data="finalData"
    :option="finalOption"
    :checkCurrent="checkboxCurrent"
    :unselectable="!canCheckOnCheckAll && isCheckAllFromBtn"
    :dic="finalDic"
    :page="tablePage"
    :tableLoading="isTableLoading"
    :span-method="handleSpanMethod"
    @size-change="sizeChange"
    @current-change="pageChange"
    @search-change="searchChange"
    @search-reset="searchChange"
    @select="handleSelect"
    @select-all="handleSelectAll"
    @search-init="baseTableInit"
    v-bind="$attrs"
    v-on="new$listeners"
  >
    <template v-for="slot in scopedSlots" v-slot:[slot.prop]="scope">
      <component
        v-if="components[slot.type]"
        :is="components[slot.type]"
        v-bind="handleBindData(scope, slot)"
      ></component>
      <slot v-else :name="slot.prop" v-bind="scope"></slot>
    </template>

    <template v-if="hasList || $scopedSlots.headerBefore" #headerBefore>
      <div class="crud-header-before">
        <baseTabs v-if="hasList" v-model="curTab" :dic="finalList" @change="handleTabChange" @tab-click="handleTabClick">
          <template #label="scoped"><slot name="tabsLabel" v-bind="scoped"></slot></template>
        </baseTabs>
        <div><slot name="headerBefore" :curTabItem="curTabItem" :searchForm="searchForm"></slot></div>
      </div>
    </template>
    <template #headerAfter>
      <slot name="headerAfter" :curTabItem="curTabItem" :searchForm="searchForm"></slot>
    </template>
    <template #[checkAllPlacement]>
      <checkAllData
        v-if="finalCheckAll || checkCurrent"
        ref="checkAllData"
        class="crud-check-all"
        v-bind="checkAllAttrs"
        v-on="checkAllListeners"
      ></checkAllData>
      <slot :name="checkAllPlacement"></slot>
    </template>
  </avue-crud>
</template>

<script>
import avueCrudMixin from './mixins/avueCrud'
import checkAllMixin from './module/checkAllData/checkAllMixin'
import parent from './mixins/parent'
import getParentAttrsMixin from './mixins/getParentAttrsMixin'
import proxyMixin from './mixins/proxyMixin'
import { cloneDeep, pull } from 'lodash'
import { getDiffData, validateDiffData, validData } from '@/components/avue/utils/util'
import { filterByPermission, getTabAllLevels, getTabValues } from '@/components/base/baseTabs/util'
import { validatenull } from '@/components/avue/utils/validate'
import { handleTableSpan, handleObjectSpanMethod } from './utils/mergeTable'
import propsOriginMixin from '@/mixins/parentProps/propsOriginMixin'
import { debounceAsync } from '@/utils/functional/debounceAsync'

let customSlotList = [] // 自定义插槽
const emptyObj = {}

export default {
  name: 'baseTable',
  componentName: 'baseTable',
  inheritAttrs: false,
  mixins: [
    propsOriginMixin,
    getParentAttrsMixin([
      'list',
      'tabOption',
      'tabOptions',
      'resetMergeData',
      'checkCurrent',
      'dic',
      'getList',
      'api',
      'isInit',
      'selectable',
      'isReserveSelection',
      'handleSearchFormProps',
      'beforeInit',
      'afterInit',
      'handleTableData',
      'handlePostData'
    ]),

    // proxyMixin 对父级赋值 应该在 子级后面
    proxyMixin([
      {
        name: 'crud',
        dataAttrs: {
          tableColumn: []
        }
      },
      {
        name: 'baseTable',
        componentName: 'crud',
        relation: 'grand'
      },
      {
        name: 'baseTable',
        relation: 'parent'
      }
    ]),

    avueCrudMixin({
      isInit: false
    }),
    checkAllMixin()
  ],
  props: {
    // 全部列表数据
    data: {
      type: Array,
      default: () => []
    },
    total: Number,
    option: {
      type: Object,
      default: () => ({})
    },
    search: {
      type: Object,
      default: () => ({})
    },
    loading: Boolean,
    showTableLoading: {
      type: Boolean,
      default: true
    },
    showAllLevels: Boolean,
    tabValue: {},
    pageObj: {
      type: Object
    },
    api: Function,
    initOnTabChange: Boolean,
    allDataApi: Function,
    handlePageData: {
      type: Function,
      default: (data) => data
    },

    checkAll: Boolean,
    checkboxCurrent: Boolean,
    checkAllPlacement: {
      default: 'menuLeftBefore'
    },
    canCheckOnCheckAll: {
      type: Boolean,
      default: true
    },
    isHandleRealData: Boolean,
    mergeKeys: {
      type: Array,
      default: () => []
    },
    spanMethod: Function,
    defaultSelection: Array,
    radioMode: Boolean
  },
  data() {
    return {
      curTab: [],
      unwatchs: {},
      tablePage: {
        pageIndex: 1,
        pageSize: 5,
        total: 0
      },
      DIC: {},
      rowSpanObj: {},
      isOnePageLock: false
    }
  },
  computed: {
    finalData() {
      let {
        data,
        getList,
        tableData,
        tablePage: { pageIndex, pageSize },
        finalOption: { topPage, page }
      } = this

      if (getList) {
        return tableData
      }

      if (validatenull(data)) return []
      // 无上下分页器，则显示全部数据
      if (topPage === false && page === false) return this.handlePageData(data)
      return this.handlePageData(
        data.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
      )
    },
    checkData({ finalData }) {
      return this.handleCheckData(finalData)
    },

    hasList() {
      return !validatenull(this.finalList)
    },
    finalList() {
      return filterByPermission(this.getParentAttrs('list'))
    },
    tabAllLevels() {
      return getTabAllLevels(this.finalList)
    },
    listObj({ finalList }) {
      return getTabValues(finalList)
    },
    curTabItem({ tabOptions }) {
      const curTabValue = this.curTab.slice(-1)[0]
      return {
        ...tabOptions.default,
        ...tabOptions[curTabValue],
        ...this.listObj[curTabValue]
      }
    },
    tabOptions() {
      const tabOptions = this.getParentAttrs('tabOptions') || {}
      const tabOption = this.getParentAttrs('tabOption')
      return {
        ...tabOptions,
        default: validData(tabOptions.default, tabOption)
      }
    },
    resetMergeData({ listObj, tabOptions }) {
      let mergeData = this.curTab.reduce((prev, value) => {
        return {
          ...prev,
          ...tabOptions[value]?.resetMergeData,
          ...listObj[value]?.resetMergeData
        }
      }, {})
      return {
        ...this.getParentAttrs('resetMergeData'),
        ...tabOptions.default?.resetMergeData,
        ...mergeData
      }
    },
    getList() {
      return this.getAttr('getList') || this.getAttr('api') || this.api
    },
    isInit() {
      return validData(this.getAttr('isInit'), true)
    },
    curOption() {
      return this.curTabItem.option || this.option
    },
    finalCheckAll() {
      return validData(this.curTabItem.checkAll, this.curOption.checkAll, this.checkAll)
    },
    checkCurrent() {
      return validData(this.curTabItem.checkCurrent, this.curOption.checkCurrent, this.getParentAttrs('checkCurrent'))
    },

    finalOption({ finalSettings, finalColumn }) {
      return {
        ...finalSettings,
        column: finalColumn,
        selection: validData(finalSettings.selection, this.finalCheckAll),
        canCheckOnCheckAll: validData(
          this.curTabItem.canCheckOnCheckAll,
          finalSettings.canCheckOnCheckAll,
          this.canCheckOnCheckAll
        )
      }
    },
    finalSettings({ curOption, finalColumn }) {
      let isOnePage = validData(curOption.isOnePage, false)
      return {
        ...curOption,
        isOnePage,
        height: undefined,
        finalHeight: validData(curOption.height, isOnePage ? '100%' : undefined),
        isSearchAuto: validData(curOption.isSearchAuto, true),
        search: validData(
          curOption.search,
          finalColumn.some((ele) => ele.search)
        ),
        rowKey: validData(curOption.rowKey, curOption.reserveSelection ? 'id' : undefined),
        topPage: validData(curOption.topPage, false),
        pageSizes: validData(curOption.pageSizes, [20, 50, 100, 200]),
        editBtn: validData(curOption.editBtn, false),
        delBtn: validData(curOption.delBtn, false),
        selectable: this.selectable
      }
    },
    finalColumn({ curOption }) {
      return cloneDeep(curOption.column || [])
    },
    finalDic() {
      return {
        ...this.DIC,
        ...this.getParentAttrs('dic'),
        ...this.curOption.dic
      }
    },
    selectable() {
      return (row, index) => {
        const selectable = this.selectableFn
        return typeof selectable !== 'function' || selectable(row, index)
      }
    },
    selectableFn() {
      return this.curOption.selectable || this.getAttr('selectable')
    },
    checkable() {
      const checkable = this.curOption.checkable || this.curTabItem.checkable

      return (row, index) => {
        return typeof checkable !== 'function' || checkable(row, index)
      }
    },
    finalHeight({ finalSettings }) {
      if (finalSettings.finalHeight && finalSettings.isOnePage) return this.isOnePageLock ? finalSettings.finalHeight : undefined
      return finalSettings.finalHeight
    },

    isReserveSelection() {
      return this.getAttr('isReserveSelection')
    },
    isTableLoading() {
      return this.showTableLoading && (this.tableLoading || this.loading)
    },

    scopedSlots({ finalColumn, slots, componentKeys }) {
      let scopedSlots = slots.map((slot) => slot)
      finalColumn.forEach((column) => {
        // 有设置插槽则开启表单插槽功能
        let tempArr = scopedSlots.filter((slot) => slot.originProp === column.prop)
        if (tempArr.length) {
          tempArr.forEach((slot) => {
            column[slot.slotType] = true
            slot.type = column.type
          })
        }
        if (componentKeys.includes(column.type)) {
          column.slot = true
          scopedSlots.push({
            prop: column.prop,
            type: column.type
          })
          if (column.search) {
            column.searchFormSlot = true
            scopedSlots.push({
              prop: `${column.prop}SearchForm`,
              type: column.type
            })
          }
        }
      })

      return scopedSlots
    },
    slots({ $scopedSlots }) {
      let scopedSlots = Object.keys($scopedSlots)
      pull(scopedSlots, ...customSlotList) // 删除插槽以便扩展

      let tempArr = []
      scopedSlots.forEach((prop) => {
        let slot = { prop }
        tempArr.push(slot)

        if (/SearchForm$/.test(prop)) {
          slot.slotType = 'searchFormSlot'
          slot.originProp = prop.replace(/SearchForm$/, '')
        } else if (/Header$/.test(prop)) {
          slot.slotType = 'headerSlot'
          slot.originProp = prop.replace(/Header$/, '')
        } else {
          slot.slotType = 'slot'
          slot.originProp = prop
        }
      })
      return tempArr
    },
    componentKeys({ components }) {
      return Object.keys(components)
    },
    components() {
      return {

      }
    },

    // flex-one-page
    // 问题：flex-one-page高度设置为100%时，若外层高度设置为自适应，table内容无法撑开flex-one-page
    // 解决方法：table数据渲染完成后，设置height为100%，使el-table重新计算table高度
    calcTableHeight({ data }) {
      this.calcTableHeightDebounced = debounceAsync(
        [
          function () {
            this.isOnePageLock = false
          },
          () => this.$nextTick,
          function () {
            if (!validatenull(this.finalData)) {
              this.isOnePageLock = true
            }
          },
          async ({ funcs }) => {
            // 使用data传入表格数据时，第一次计算高度会有延迟，导致高度在没有达到最大高度的情况下，开启了表格滚动
            if (!validatenull(this.data)) {
              await new Promise(resolve => setTimeout(resolve))
              this.calcTableHeightDebounced()
              // 当前函数仅运行一次
              funcs.pop()
            }
          }
        ]
      )
      return this.calcTableHeightDebounced
    },

    handleSearchFormProps() {
      return this.getAttr('handleSearchFormProps')
    },
    new$listeners() {
      return Object.assign(
        {
          ...this.$listeners
        },
        {
          input: () => {},
          'selection-change': (selection) => {
            if (!this.$refs.checkAllData) {
              this.$emit('selection-change', selection)
              this.handleSelectionChange(selection)
            }
          }
        }
      )
    }
  },
  watch: {
    curOption: {
      handler() {
        this.tablePage.pageIndex = 1

        this.getDic()
      },
      immediate: true
    },
    data: {
      handler(n, o) {
        if (!this.getList) {
          this.tablePage.total = this.total || n?.length || 0

          if (n !== o) {
            this.tablePage.pageIndex = 1
          }
        }
      },
      immediate: true
    },
    finalData: {
      handler(newVal) {
        if (this.mergeKeys.length) {
          this.rowSpanObj = handleTableSpan(this.mergeKeys, newVal)
        }

        this.calcTableHeight()
      },
      immediate: true
    },
    search: {
      handler(search) {
        this.searchForm = Object.assign(this.searchForm, search)
      },
      immediate: true,
      deep: true
    },
    defaultSelection: {
      handler(n) {
        if (!validatenull(n)) {
          this.$nextTick(function () {
            this.toggleSelection(n, true)
          })
        }
      },
      immediate: true
    },
    selectableFn: 'clearSelection',
    tabValue: {
      handler(n) {
        if (!validatenull(n)) {
          this.toggleTab(n)
        }
      },
      immediate: true
    }
  },
  created() {
    this.initPage()
    if (!this.finalOption.search) this.baseTableInit()
  },
  activated() {
    this.getDic()
  },
  methods: {
    handleTabChange() {
      this.tableData = [] // 防止切换时，表格内容重复渲染
      this.searchForm = {}
      this.$emit('tab-change', this.showAllLevels ? this.curTab : this.curTab.slice(-1)[0])
      this.$nextTick(function () {
        (this.isInit || this.initOnTabChange) && this.searchChange()
      })
    },
    handleTabClick(...args) {
      this.$emit('tab-click', ...args)
    },
    toggleTab(value) {
      let allLevels = this.tabAllLevels[value]
      // console.log('toggleTab', allLevels)
      if (allLevels) {
        this.curTab = allLevels
        this.handleTabChange()
      }
    },

    initPage() {
      let { unwatchs } = this
      if (unwatchs.initPage) unwatchs.initPage()
      unwatchs.initPage = this.$watch(
        function ({ pageObj }) {
          if (pageObj) return pageObj

          let {
            tablePage,
            finalOption: { pageSizes = [5, 10, 15, 20], pageSize }
          } = this

          if (getDiffData(pageSizes, this.oPageSizes)) {
            tablePage.pageSize = pageSize || pageSizes[0]
            this.oPageSizes = pageSizes
          }

          return tablePage
        },
        function (n) {
          n.total = this.tablePage.total
          this.tablePage = n
        },
        {
          immediate: true
        }
      )
    },

    // 解决searchForm默认值未设置即发起请求
    baseTableInit() {
      if (this.isInit && !this.hasList) {
        this.init()
      }
    },

    toggleSelection(...args) {
      const { crud, checkAllData } = this.$refs
      const { toggleSelection } = checkAllData || crud || {}
      return toggleSelection?.apply(null, args)
    },
    toggleRowSelection(...args) {
      const { crud, checkAllData } = this.$refs
      const { toggleRowSelection } = checkAllData || crud || {}
      return toggleRowSelection?.apply(null, args)
    },
    clearSelection(...args) {
      const { crud, checkAllData } = this.$refs
      const { clearSelection } = checkAllData || crud || {}
      return clearSelection?.apply(null, args)
    },
    toggleRowExpansion(row, expanded) {
      return this.$refs.crud.toggleRowExpansion(row, expanded)
    },
    async getDic() {
      const curRequest = this.DICLastRequest = this.$store.dispatch('HandleOption', { column: this.finalColumn })
      await curRequest
      if (curRequest === this.DICLastRequest) {
        this.DIC = await this.DICLastRequest
      }
    },

    handleSpanMethod(tableObj, vm) {
      let spanMethod = this.curTabItem.spanMethod || this.spanMethod
      if (typeof spanMethod === 'function') return spanMethod(tableObj, vm)

      return handleObjectSpanMethod(tableObj, this.mergeKeys, this.rowSpanObj, this.notEmpty)
    },

    beforeInit() {
      return this.runFn(this.getAttr('beforeInit'))
    },
    afterInit(res, postData, data) {
      // getAllData
      if (validateDiffData(this.postData, this.oPostData, ['page'])) this.oAllData = null
      this.oPostData = postData

      // tab 切换时，如果表格列数差距过大，会导致表格样式错乱
      this.$refs.crud?.doLayout()
      this.$nextTick(this.$refs.crud?.doLayout)

      return this.runFn(this.getAttr('afterInit'), res, postData, data)
    },
    handleTableData(data) {
      return this.runFn(this.getAttr('handleTableData'), data) || data
    },
    handlePostData(data, searchForm) {
      return this.runFn(this.getAttr('handlePostData'), data, searchForm, this) || data
    },

    doLayout() {
      return this.$refs.crud?.doLayout()
    },

    // 传值方式：curTabItem、$attrs、sup_this
    getAttr(prop) {
      return this.curTabItem[prop] || this.getParentAttrs(prop)
    },

    handleBindData(scope, slot) {
      return scope
    },
    runFn(fn, ...args) {
      return typeof fn === 'function' && fn(...args)
    },
    validData
  }
}
</script>

<style lang="scss" scoped>
::v-deep.crud-container {
  width: 100%;
  &.flex-one-page {
    .el-table__body-wrapper {
      overflow-y: auto;
    }
    .table-checkbox-wrapper {
      flex: 1;
      overflow: hidden auto;
    }
  }
  .el-table {
    border-top: 1px solid #EBEEF5;
    border-left: 1px solid #EBEEF5;
    &::after {
      content: '';
      position: absolute;
      background-color: #ebeef5;
      z-index: 2000;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
    }
  }
  .crud-header-before {
    display: flex;
    justify-content: space-between;
    position: relative;
    width: 100%;
    margin-bottom: 16px;
  }
  .base-tabs {
    .base-tabs {
      margin-top: 16px;
    }
  }

  &.hide-tabs {
    .crud-header-before {
      display: none;
    }
  }
}
</style>
