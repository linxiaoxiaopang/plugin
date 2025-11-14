<template>
  <avue-crud
    v-fit-operation="isFitOperation && 'table-operation'"
    ref="crud"
    :data="finalData"
    :option="option"
    :page="tablePage"
    :tableLoading="tableLoading"
    @size-change="sizeChange"
    @current-change="pageChange"
    @search-change="searchChange"
    v-bind="$attrs"
    v-on="new$listeners"
  >
    <template v-for="col in slotColumns" v-slot:[col.prop]="scope">
      <template v-if="col.type === 'imgText'">
        <div class="flex-middle">
          <defaultImg
            :src="getSrc(scope.row, col)"
            :previewSrcList="isPreviewSrcList(scope.row, col)"
            v-bind="getImgAttr(col)"
          ></defaultImg>
          <slot :name="col.prop + 'Text'" v-bind="scope">
            <div class="ml10">{{ scope.row[col.textProp] }}</div>
          </slot>
        </div>
      </template>
      <template v-else-if="col.type === 'image'">
        <defaultImg
          :src="getSrc(scope.row, col)"
          :previewSrcList="isPreviewSrcList(scope.row, col)"
          v-bind="getImgAttr(col)"
        ></defaultImg>
      </template>
      <slot v-else :name="col.prop" v-bind="scope">
        <span></span>
      </slot>
    </template>

    <template v-for="name in otherSlots" v-slot:[name]="scope">
      <slot :name="name" v-bind="scope">
        <span></span>
      </slot>
    </template>
  </avue-crud>
</template>

<script>
import { avueCrud, componentMethodsMixin } from '@/mixins'
import defaultImg from '@/views/components/defaultImg'
import { vaildData } from '@/components/avue/utils/util'

export default {
  inheritAttrs: false,
  components: {
    defaultImg
  },
  mixins: [
    avueCrud({
      isInit: false
    }),
    componentMethodsMixin(
      'crud',
      [
        'toggleSelection',
        'toggleRowExpansion',
        'rowAdd',
        'rowEdit',
        'doLayout'
      ]
    )
  ],
  props: {
    // 全部列表数据
    data: {
      type: Array,
      default: () => []
    },
    option: Object,
    pageObj: {
      type: Object
    },
    isInit: {
      type: Boolean,
      default: true
    },
    getList: Function,
    resetMergeData: Object,
    getFinalData: Function,
    isFitOperation: Boolean
  },
  data() {
    return {
      unwatchs: {},
      tablePage: {
        pageIndex: 1,
        pageSize: 5,
        total: 0
      }
    }
  },
  computed: {
    new$listeners() {
      return Object.assign(
        {
          ...this.$listeners
        },
        {
          input: () => {}
        }
      )
    },
    finalData() {
      let {
        data,
        getList,
        tableData,
        getFinalData,
        tablePage: { pageIndex, pageSize },
        option: { topPage, page }
      } = this

      if (getList) {
        if (typeof getFinalData === 'function') {
          return getFinalData(tableData)
        }
        return tableData
      }

      // 无上下分页器，则显示全部数据
      if (topPage === false && page === false) return data
      return data.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
    },
    slotColumns({ option: { column } }) {
      return column
        .filter(({ slot, hide }) => slot && !hide)
    },
    slotColumnsProps({ slotColumns }) {
      return slotColumns.map(({ prop }) => prop)
    },
    otherSlots({ $scopedSlots, slotColumnsProps }) {
      let slots = Object.keys($scopedSlots)
      return slots.filter(slot => !slotColumnsProps.includes(slot))
    }
  },
  watch: {
    option: {
      handler(n) {
        if (n) {
          n?.column.forEach(col => {
            if (/image|imgText/.test(col.type)) {
              col.slot = true
            }
          })
        }
      },
      immediate: true,
      deep: true
    },
    data: {
      handler(n, o) {
        this.tablePage.total = n?.length || 0

        if (n !== o) {
          this.tablePage.pageIndex = 1
        }
      },
      immediate: true
    },
    getList: {
      handler(n) {
        if (this.isInit && n) {
          this.initPage()
          this.init()
        }
      },
      immediate: true
    }
  },
  created() {
    this.initPage()
  },
  methods: {
    initPage() {
      let { unwatchs } = this
      if (unwatchs.initPage) unwatchs.initPage()
      unwatchs.initPage = this.$watch(
        function ({ pageObj }) {
          if (pageObj) return pageObj

          let {
            tablePage,
            option: {
              pageSizes = [5, 10, 15, 20]
            }
          } = this

          if (pageSizes) {
            tablePage.pageSize = pageSizes[0]
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

    isPreviewSrcList(row, col) {
      if (col.isPreviewSrcList === true) {
        return [this.getSrc(row, col)]
      }
      return []
    },
    getSrc(row, col) {
      return row[col.srcProp] || row[col.prop]
    },
    getImgAttr(col) {
      let imgAttr = col.imgAttr || {}
      return {
        ...imgAttr,
        disabled: vaildData(imgAttr.disabled, true),
        size: vaildData(imgAttr.size/*, 'large'*/),
        width: vaildData(imgAttr.width, '50'),
        height: vaildData(imgAttr.height, '50')
      }
    }
  }
}
</script>

<style lang="scss">

</style>
