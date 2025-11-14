<template>
  <div class="crud-container pull-auto">
    <slot name="before"></slot>
    <slot name="headerBefore"></slot>
    <header-search v-if="option.search !== false" ref="headerSearch" :search="search">
      <template slot="searchMenu" slot-scope="scope">
        <slot name="searchMenu" v-bind="scope"></slot>
      </template>
      <template slot-scope="scope" v-for="item in searchSlot" :slot="item">
        <slot v-bind="scope" :name="item"></slot>
      </template>
    </header-search>
    <slot name="headerAfter"></slot>
    <paginationOperation>
      <template #left>
        <slot name="menuLeftBefore"></slot>
        <el-button v-if="vaildData(option.addBtn, false)" type="primary" :size="DEFAULT_TABLE_SIZE" @click="rowAdd">
          {{ option.addBtnText || '新增' }}
        </el-button>
        <slot name="menuLeft"></slot>
      </template>
      <template #right>
        <slot name="menuRight"></slot>
        <template v-if="columnBtn">
          <columnVisibleDialog :columnList="columnList" @submit="columnVisibleSubmit">
            <template #columnBtn>
              <slot name="columnBtn"></slot>
            </template>
          </columnVisibleDialog>
        </template>
      </template>
      <el-pagination
        v-if="vaildData(option.topPage, true) && !validatenull(page)"
        class="crud-pagination crud-pagination-top"
        :current-page.sync="page.pageIndex"
        :background="vaildData(option.pageBackground, true)"
        :page-sizes="pageSizes"
        :page-size="page.pageSize"
        :hide-on-single-page="hideOnSinglePage"
        @size-change="sizeChange"
        @current-change="currentChange"
        layout="total, slot, prev, pager, next, jumper"
        :total="page.total"
      >
        <span class="el-pagination__sizes mr10">
          <el-select
            :value="page.pageSize"
            size="mini"
            placeholder="请选择"
            :popper-append-to-body="vaildData(option.paginationPopperAppendToBody, true)"
            @change="sizeChange"
          >
            <el-option v-for="item in pageSizes" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
        </span>
      </el-pagination>
    </paginationOperation>
    <slot name="header"></slot>
    <slot
      v-if="$slots.default || ['checkbox', 'list'].includes(option.type)"
      :dic="data"
      :props="option.props"
      v-bind="selectionAttrs"
    >
      <checkboxGroup
        ref="table"
        v-loading="tableLoading"
        style="width: 100%;"
        :type="option.type"
        :dic="data"
        :props="option.props"
        :checkAll="checkCurrent"
        v-bind="selectionAttrs"
        @checkbox-toggle="checkboxToggle"
        @select="select"
        @select-all="selectAll"
        @selection-change="selectionChange"
      >
        <template #item="scope">
          <slot name="item" v-bind="scope"></slot>
        </template>

        <template #empty>
          <slot name="empty"></slot>
        </template>
        <template #none>
          <slot name="none"></slot>
        </template>
      </checkboxGroup>
    </slot>
    <el-table
      v-else
      ref="table"
      :key="reload"
      :data="data"
      :row-key="option.rowKey"
      :expand-row-keys="expandRowKeys"
      :lazy="lazy"
      :load="load"
      :tree-props="vaildData(option.treeProps, { children: 'children', hasChildren: 'hasChildren' })"
      v-loading="tableLoading"
      :stripe="option.stripe"
      :show-header="option.showHeader"
      :default-sort="option.defaultSort"
      :show-summary="showSummary"
      :summary-method="tableSummaryMethod"
      :max-height="option.maxHeight"
      :height="finalHeight == 'auto' ? $AVUE.clientHeight - vaildData(option.calcHeight, 275) : finalHeight"
      :width="setPx(option.width, '100%')"
      :border="vaildData(option.border, DEFAULT_TABLE_BORDER)"
      :row-class-name="tableRowClassName"
      :cell-class-name="tableCellClassName"
      :header-cell-class-name="tableHeaderCellClassName"
      :span-method="tableSpanMethod"
      @row-click="rowClick"
      @row-dblclick="rowDblclick"
      @cell-click="cellClick"
      @sort-change="sortChange"
      @select="select"
      @select-all="selectAll"
      @selection-change="selectionChange"
    >
      <!-- 下拉弹出框  -->
      <template v-if="option.expand">
        <el-table-column key="expand" type="expand" prop="expand" width="50" fixed="left" align="center">
          <template slot-scope="props">
            <slot :row="props.row" name="expand"></slot>
          </template>
        </el-table-column>
      </template>
      <!-- 选择框 -->
      <template v-if="option.selection">
        <el-table-column
          key="selection"
          type="selection"
          prop="selection"
          width="50"
          align="center"
          :selectable="selectable"
          :reserve-selection="option.reserveSelection"
        ></el-table-column>
      </template>

      <!-- 序号 -->
      <template v-if="option.index">
        <el-table-column
          key="index"
          prop="index"
          :label="vaildData(option.indexLabel, '序号')"
          type="index"
          :index="indexMethod"
          width="50"
          fixed="left"
          align="center"
        ></el-table-column>
      </template>
      <!-- 循环列 -->
      <template v-for="column in tableColumn">
        <column-dynamic
          v-if="column.children && column.children.length > 0"
          :key="column.label || column.prop"
          :columnOption="column"
        >
          <template v-for="item in mainSlot" slot-scope="scope" :slot="item">
            <slot v-bind="scope" :name="item"></slot>
          </template>
        </column-dynamic>
        <column-slot v-else :column="column" :column-option="tableColumn">
          <template v-for="item in mainSlot" slot-scope="scope" :slot="item">
            <slot v-bind="scope" :name="item"></slot>
          </template>
        </column-slot>
      </template>
      <el-table-column
        v-if="vaildData(option.menu, true)"
        label="操作"
        prop="$menu"
        class-name="table-operation"
        :fixed="option.menuFixed === 'normal' ? undefined : vaildData(option.menuFixed, 'right')"
        :align="vaildData(option.menuAlign, 'center')"
        :header-align="option.menuHeaderAlign"
        :width="vaildData(option.menuWidth, 240)"
      >
        <template slot-scope="scope">
          <lazyComponent
            :lazy="vaildData(option.menuLazy, option.lazy)"
            :lazyMounted="vaildData(option.menuLazyMounted, option.lazyMounted)"
            :scrollContainer="option.scrollContainer"
            :isOnePage="option.isOnePage"
            :sign="scope.$index"
            :height="option.lazyHeight"
          >
            <table-operation :outerMaxSize="option.outerMaxSize">
              <slot :row="scope.row" name="menu" :index="scope.$index" v-bind="scope"></slot>
              <template v-if="vaildData(option.menu, true)">
                <template v-if="vaildData(option.editBtn, true)">
                  <el-button class="menu-btn-item" type="text" @click.stop.safe="rowEdit(scope.row, scope.$index)"
                  >修改</el-button
                  >
                </template>
                <template v-if="vaildData(option.delBtn, true)">
                  <Popover class="menu-btn-item" @sureHandler="rowDel($event, scope.row, scope.$index)">
                    <template #tip>
                      <p>{{ option.delTip || '您确定要删除该行数据么?' }}</p>
                    </template>
                    <template #reference="{ popoverLoading }">
                      <el-button type="text" danger :loading="popoverLoading">删除</el-button>
                    </template>
                  </Popover>
                </template>
              </template>
            </table-operation>
          </lazyComponent>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <el-pagination
      v-if="vaildData(option.page, true) && !validatenull(page)"
      class="crud-pagination crud-pagination-bottom pull-right"
      :current-page.sync="page.pageIndex"
      :background="vaildData(option.pageBackground, true)"
      :page-sizes="pageSizes"
      :page-size="page.pageSize"
      :hide-on-single-page="hideOnSinglePage"
      @size-change="sizeChange"
      @current-change="currentChange"
      :layout="$attrs.layout || 'total, slot, prev, pager, next, jumper'"
      :total="page.total"
    >
      <div class="crud-pagination-left">
        <slot name="page"></slot>
      </div>
      <span class="el-pagination__sizes mr10">
        <el-select
          :value="page.pageSize"
          size="mini"
          placeholder="请选择"
          :popper-append-to-body="vaildData(option.paginationPopperAppendToBody, true)"
          @change="sizeChange"
        >
          <el-option v-for="item in pageSizes" :key="item.value" :label="item.label" :value="item.value"> </el-option>
        </el-select>
      </span>
    </el-pagination>
    <slot name="after"></slot>
    <!-- 表单 -->
    <el-dialog
      v-if="boxVisible || boxVisibleLock"
      lock-scroll
      v-el-drag-dialog
      :fullscreen="vaildData(option.formFullscreen, false)"
      :modal-append-to-body="false"
      :append-to-body="true"
      :title="boxType == 0 ? option.addBtnText || '新增' : option.editBtnText || '修改'"
      :visible.sync="boxVisible"
      :width="vaildData(option.formWidth, '60%')"
      :before-close="hide"
      @close="dialogFormClose"
      @closed="boxVisibleLock = false"
    >
      <el-form
        ref="tableForm"
        class="crud-form"
        :model="tableForm"
        :label-width="setPx(option.labelWidth, 80)"
        :rules="tableFormRules"
        :size="vaildData(option.formSize, DEFAULT_TABLE_SIZE)"
        :validate-on-rule-change="vaildData(option.validateOnRuleChange, false)"
        @submit.native.prevent
      >
        <el-row :gutter="20" :span="24">
          <template v-for="(column, index) in dialogFormColumn">
            <el-col :span="column.span || option.dialogFormSpan || 12">
              <el-form-item
                :style="{ height: setPx(column.formHeight, 'auto') }"
                :label="vaildData(column.dialogFormLabel, column.label)"
                :prop="column.prop"
                :label-width="setPx(column.labelWidth, option.labelWidth || 80)"
              >
                <slot
                  :form="tableForm"
                  :prop="column.prop"
                  :value="tableForm[column.prop]"
                  :column="column"
                  :dic="setDic(column, DIC)"
                  :name="column.prop + 'Form'"
                  v-if="column.formslot"
                ></slot>
                <component
                  v-else
                  :is="getComponent(column.type)"
                  v-model="tableForm[column.prop]"
                  :column="column"
                  :precision="column.precision"
                  :height="setPx(column.formHeight, 'auto')"
                  :size="vaildData(column.size, DEFAULT_TABLE_SIZE)"
                  :clearable="column.clearable"
                  :type="column.type"
                  :props="column.props"
                  :minRows="column.minRows"
                  :maxRows="column.maxRows"
                  :emitPath="column.emitPath"
                  :checkStrictly="column.checkStrictly"
                  :show-all-levels="column.showAllLevels"
                  :placeholder="vaildData(column.dialogFormLabel, column.label)"
                  :dic="setDic(column, DIC)"
                  :disabled="
                    boxType == 0 ? vaildData(column.addDisabled, false) : vaildData(column.editDisabled, false)
                  "
                  :format="column.format"
                  :value-format="column.valueFormat"
                ></component>
              </el-form-item>
            </el-col>
          </template>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="hide">取 消</el-button>
        <el-button type="primary" @click="rowUpdate" :loading="boxLoading" v-if="boxType == 1">确定</el-button>
        <el-button type="primary" @click="rowSave" :loading="boxLoading" v-else>确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import headerSearch from './headerSearch'
import tableOperation from './tableOperation'
import lazyComponent from '@/components/avue/crud/src/lazyComponent'
import columnVisibleDialog from './columnVisibleDialog'
import columnSlot from './column-slot'
import columnDynamic from './column-dynamic'
import crud from '../../mixins/crud.js'
import slot from '@/components/avue/core/slot'
import { DEFAULT_TABLE_SIZE, DEFAULT_TABLE_BORDER } from '../../utils/const/config'
import { validatenull } from '../../utils/validate.js'
import tableTemp from '../../utils/tableTemp.js'
import { calcCascader } from '@/components/avue/core/dataformat'
import { validData } from '@/components/avue/utils/util'
import { isEqual } from '@/components/avue/utils/validate'

export default {
  name: 'AvueCrud',
  components: {
    headerSearch,
    columnSlot,
    columnDynamic,
    columnVisibleDialog,
    tableOperation,
    lazyComponent: {
      name: 'LazyComponentWrap',
      functional: true,
      render(h, { props, scopedSlots }) {
        if (!(props.lazy || props.lazyMounted)) return scopedSlots.default?.()
        return h(
          lazyComponent,
          {
            props,
            scopedSlots
          }
        )
      }
    }
  },
  mixins: [crud(), slot],
  props: {
    value: {
      type: Object,
      default: () => {
        return {}
      }
    },
    showSummary: Boolean,
    summaryMethod: Function,
    lazy: Boolean,
    load: Function,
    spanMethod: Function,
    rowClassName: Function,
    cellClassName: Function | String,
    beforeClose: Function,
    beforeOpen: Function,
    expandRowKeys: {
      type: Array
    },
    page: {
      type: Object,
      default() {
        return {
          // total: 0, //总页数
          // pageIndex: 0, //当前页数
          // pageSize: 10, //每页显示多少条
          // background: true //背景颜色
        }
      }
    },
    tableLoading: {
      type: Boolean,
      default: false
    },
    search: {
      type: Object,
      default() {
        return {}
      }
    },
    data: {
      type: Array,
      required: true,
      default: () => {
        return []
      }
    },
    option: {
      type: Object,
      required: true,
      default: () => ({})
    },
    dic: {
      type: Object,
      default: () => ({})
    },
    height: [String, Number],
    checkCurrent: Boolean,
    unselectable: Boolean
  },
  data() {
    return {
      reload: Math.random(),
      DEFAULT_TABLE_SIZE,
      DEFAULT_TABLE_BORDER,
      hideOnSinglePage: false,

      overHidden: true,

      // 表格列显隐
      columnSortList: null,

      boxVisible: false,
      boxVisibleLock: false,
      boxLoading: false,
      boxType: 0,
      DIC: {},
      tableForm: {},
      tableFormRules: {},
      tableIndex: -1,
      tableSelect: []
    }
  },
  computed: {
    searchSlot({ $scopedSlots }) {
      return this.option.column
        .filter((column) => column.search)
        .map(({ searchSlotName, prop }) => {
          if ($scopedSlots[searchSlotName]) return searchSlotName

          const slotName = `${ prop }SearchForm`
          if ($scopedSlots[slotName]) return slotName
        })
        .filter(Boolean)
    },
    mainSlot({ propOption, $scopedSlots }) {
      let result = []
      propOption.forEach((item) => {
        if ($scopedSlots[item.prop]) result.push(item.prop)
        if ($scopedSlots[item.slotName]) result.push(item.slotName)
        if ($scopedSlots[item.headerSlotName]) result.push(item.headerSlotName)
      })
      return this.getSlotList(['Header', 'Form'], $scopedSlots, propOption).concat(result)
    },
    propOption() {
      let result = []
      function findProp(list = []) {
        if (!Array.isArray(list)) return
        list.forEach((ele) => {
          result.push(ele)
          if (ele.children) findProp(ele.children)
        })
      }
      findProp(this.tableColumn)
      result = calcCascader(result)
      return result
    },
    columnList() {
      return (this.option.column || []).filter((column) => {
        return !column.hide
      })
    },
    tableColumn() {
      return this.columnVisibleList
        .filter((column, index) => {
          column.$sort = column.$sort === undefined ? index : column.$sort
          column.$sortKey = `${column.prop}-${column.$sort}`
          return column.$checked !== false
        })
        .sort((a, b) => a.$sort - b.$sort)
    },
    columnVisibleList() {
      return this.columnSortList || this.columnList
    },
    columnBtn() {
      return this.vaildData(this.option.columnBtn, false)
    },
    dialogFormColumn() {
      return (this.option.column || [])
        .filter((column) => {
          return this.boxType == 0 ? this.vaildData(column.addDisplay, true) : this.vaildData(column.editDisplay, true)
        })
        .map((column, index) => {
          column.dialogFormSort = this.vaildData(column.dialogFormSort, index)
          return column
        })
        .sort((a, b) => a.dialogFormSort - b.dialogFormSort)
    },

    pageSizes({ option: { pageSizes } }) {
      pageSizes = this.vaildData(pageSizes, [5, 10, 15, 20])
      return pageSizes.map((item) => {
        return {
          label: `${item}条/页`,
          value: item
        }
      })
    },

    finalHeight() {
      return this.vaildData(this.height, this.option.height)
    },

    selectable({ option: { selectable } }) {
      return (row, index) => {
        if (this.unselectable) return false
        return typeof selectable !== 'function' || selectable(row, index)
      }
    },

    selectionAttrs({ option }) {
      return {
        max: option.max,
        min: option.min,
        selectable: this.selectable,
        reserveSelection: option.reserveSelection,
        radioMode: option.radioMode,
        span: option.span,
        prevent: validData(option.prevent, true),
        gutter: option.gutter
      }
    }
  },
  watch: {
    option: {
      handler(n, o) {
        this.hideOnSinglePage = this.vaildData(n.hideOnSinglePage, false)
        if (!isEqual(n, o)) {
          //初始化字典
          this.dicInit()
          if (!isEqual(n, o, 'dic')) {
            this.refreshTable()
            //初始化表单
            this.formInit()
            this.rulesInit()
          }
        }
      },
      immediate: true,
      deep: true
    },
    tableForm: {
      handler(n, o) {
        this.formVal()
      },
      deep: true
    },
    dic: {
      handler(dic) {
        Object.keys(dic).forEach((key) => {
          this.$set(this.DIC, key, dic[key])
        })
      },
      immediate: true
    }
  },
  created() {
    //规则初始化
    this.rulesInit()
    //初始化字典
    this.dicInit()
    //初始化表单
    this.formInit()
  },
  mounted() {},
  methods: {
    validatenull,
    rulesInit() {
      let {
        option: { searchSpan, searchLabelWidth, colWidth, colMinWidth }
      } = this
      this.tableFormRules = {}
      // this.option.dic = []
      this.option.column?.forEach((ele) => {
        // this.getDicData(ele)
        // this.setCascaderItem('form', ele)

        ele.width = this.vaildData(ele.width, colWidth)
        ele.minWidth = this.vaildData(ele.minWidth, colMinWidth)
        ele.searchSpan = this.vaildData(ele.searchSpan, searchSpan)
        ele.searchLabelWidth = this.vaildData(ele.searchLabelWidth, searchLabelWidth)

        if (ele.rules) {
          let rules = Array.isArray(ele.rules) ? ele.rules : [ele.rules]
          this.tableFormRules[ele.prop] = rules.map((rule) => {
            if (rule.required === true) {
              return {
                message: `${ele.label || '该项'}必填`,
                ...rule
              }
            }
            return rule
          })
        }
      })
    },
    dicInit() {
      this.GetDic(this.option.dic).then((data) => {
        Object.keys(data).forEach((key) => {
          this.$set(this.DIC, key, data[key])
        })
      })
    },
    formVal() {
      this.$emit('input', this.tableForm)
    },
    formReset() {
      this.tableForm = {}
      // for (let o in this.tableForm) {
      //   if (this.tableForm[o] instanceof Array) {
      //     this.tableForm[o] = []
      //   } else if (typeof this.tableForm[o] === 'number') {
      //     this.tableForm[o] = 0
      //   } else {
      //     this.tableForm[o] = ''
      //   }
      // }
    },
    formInit() {
      const list = this.option.column
      let form = {}
      list.forEach((ele) => {
        if (['checkbox', 'daterange', 'cascader'].includes(ele.type)) {
          form[ele.prop] = []
        } else if (ele.type == 'number') {
          form[ele.prop] = 0
        } else {
          form[ele.prop] = ''
        }
        if (!validatenull(ele.value)) form[ele.prop] = ele.value
      })
      this.tableForm = Object.assign({}, form)
    },
    refreshTable(callback) {
      this.reload = Math.random()
      this.$nextTick(() => {
        callback && callback()
      })
    },
    // 页大小回调
    sizeChange(val) {
      this.hideOnSinglePage = false
      this.$emit('size-change', val)
    },
    // 页码回调
    currentChange(val) {
      this.$emit('current-change', val)
    },
    // 选中实例
    toggleSelection(rows, selected) {
      if (rows) {
        rows.forEach((row) => {
          this.toggleRowSelection(row, selected)
        })
      } else {
        this.clearSelection()
      }
    },
    toggleRowSelection(row, selected) {
      return this.$refs.table?.toggleRowSelection(row, selected)
    },
    clearSelection(...args) {
      return this.$refs.table?.clearSelection(...args)
    },
    //选择回调
    selectionChange(val) {
      this.tableSelect = val
      this.$emit('selection-change', val)
    },
    select(selection, row) {
      this.$emit('select', selection, row)
    },
    selectAll(selection) {
      this.$emit('select-all', selection)
    },
    checkboxToggle(row, selected) {
      this.$emit('checkboxToggle', row, selected)
    },
    //排序回调
    sortChange(val) {
      this.$emit('sort-change', val)
    },

    tableSummaryMethod(param) {
      if (typeof this.summaryMethod === 'function') return this.summaryMethod(param)
    },
    //合并行
    tableSpanMethod(param) {
      if (typeof this.spanMethod === 'function') return this.spanMethod(param, this)
    },
    //行添加class
    tableRowClassName(param) {
      let result = [param.row.$rowClassName]
      let { rowClassName } = this
      if (typeof rowClassName === 'function') {
        result.push(rowClassName(param))
      } else if (typeof rowClassName === 'string') {
        result.push(rowClassName)
      }
      return result.filter(Boolean).join(' ')
    },
    // 单元格添加class
    tableCellClassName(params) {
      let { cellClassName } = this
      if (typeof cellClassName === 'function') cellClassName = cellClassName(params)

      let { column, rowIndex } = params

      return [cellClassName, `uiid-zd-${rowIndex}-${column.property}`].filter(Boolean).join(' ')
    },
    tableHeaderCellClassName({ column }) {
      return `uiid-zd-header-${column.property}`
    },

    //当某个单元格被点击时会触发该事件
    cellClick(row, column, cell, event) {
      this.$emit('cell-click', row, column, cell, event)
    },
    //行单机
    rowClick(row, event, column) {
      this.$emit('row-click', row, event, column)
    },
    //行双击
    rowDblclick(row, event) {
      this.$emit('row-dblclick', row, event)
    },
    // 新增
    rowAdd() {
      this.boxType = 0
      this.show()
    },
    // 编辑
    rowEdit(row, index) {
      this.tableForm = Object.assign({}, row)
      this.tableIndex = index
      this.boxType = 1
      this.show()
    },
    // 删除
    rowDel(that, row, index) {
      return new Promise((resolve) => {
        this.$emit('row-del', row, index, resolve)
      })
    },
    //保存
    rowSave() {
      this.$refs['tableForm'].validate((valid) => {
        if (valid) {
          this.boxLoading = true
          this.$emit('row-save', Object.assign({}, this.tableForm), this.hide, () => (this.boxLoading = false))
        }
      })
    },
    //更新
    rowUpdate() {
      this.$refs['tableForm'].validate((valid) => {
        if (valid) {
          const index = this.tableIndex
          this.boxLoading = true
          this.$emit('row-update', Object.assign({}, this.tableForm), index, this.hide, () => (this.boxLoading = false))
        }
      })
    },
    //显示表单
    show(cancel) {
      this.boxLoading = false
      const callack = () => {
        if (cancel !== true) {
          this.boxVisible = true
          this.boxVisibleLock = true
          this.$nextTick(function () {
            this.$refs['tableForm'].clearValidate()
          })
        }
      }
      if (typeof this.beforeOpen === 'function') this.beforeOpen(callack)
      else callack()
    },
    //隐藏表单
    hide(cancel) {
      const callack = () => {
        if (cancel !== false) {
          this.$nextTick(() => {
            this.$refs['tableForm']?.resetFields()
            //释放form表单
            this.formReset()
          })
          this.boxVisible = false
        }
        this.boxLoading = false
      }
      if (typeof this.beforeClose === 'function') this.beforeClose(callack)
      else callack()
    },
    dialogFormClose() {
      this.$emit('close')
    },
    validate(callback) {
      return this.$refs.headerSearch.validate(callback)
    },
    indexMethod: function indexMethod(index) {
      return index + 1 + ((this.page.pageIndex || 1) - 1) * (this.page.pageSize || 10)
    },
    rowPrint() {
      console.log('rowPrint')
      // this.overHidden = false;
      // this.$nextTick(function () {
      //   this.$print(this.$refs.table);
      //   this.overHidden = true;
      // })

      if (validatenull(this.data)) {
        this.$message.warning('请勾选要打印的数据')
        return
      }
      /*const getTemplate = () => {
       return tableTemp(
       this.tableColumn,
       this.data,
       this.tableColumn
       );
       };*/

      this.$nextTick(() => {
        var newstr = this.getTemplate()
        var tab = window.open('', '打印')
        tab.document.open()
        tab.document.write(newstr)
        tab.window.print()
        tab.close()
      })
    },
    getTemplate() {
      return tableTemp(this.tableColumn, this.data, this.tableColumn)
    },

    toggleRowExpansion(row, expanded) {
      this.$refs.table.toggleRowExpansion(row, expanded)
    },
    doLayout() {
      return this.$refs.table.doLayout()
    },

    columnVisibleSubmit(list) {
      this.columnSortList = list
      this.$emit('column-change', this.tableColumn, this.columnList)
    },

    tableMethods(fnName, ...args) {
      this.$nextTick(function () {
        this.$refs.table?.[fnName]?.(...args)
      })
    }
  },
  provide() {
    return {
      crud: this
    }
  }
}
</script>
