<template>
  <avue-crud
    :data="tableData"
    :option="tableOption"
    :page="tablePage"
    @size-change="sizeChange"
    @current-change="pageChange"
  >
  </avue-crud>
</template>
<script>
export default {
  props: {
    data: {
      type: Array,
      default: () => []
    },
    option: {
      type: Object,
      default: () => ({})
    },
    size: {
      type: Number | String,
      default: 10
    }
  },
  data() {
    return {
      pageIndex: 1,
      pageSize: 10,
      total: 0
    }
  },
  computed: {
    tableData({ data, pageIndex, pageSize }) {
      return data.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
    },
    tablePage({ pageIndex, pageSize, total }) {
      return {
        pageIndex,
        pageSize,
        total
      }
    },
    tableOption({ option }) {
      return {
        menu: false,
        hideOnSinglePage: false,
        pageSizes: [5, 10],
        ...option
      }
    }
  },
  watch: {
    data: {
      handler(n) {
        this.init()
        this.total = n.length
      },
      immediate: true,
      deep: true
    },
    size: {
      handler(n) {
        this.pageSize = n
      },
      immediate: true
    }
  },
  methods: {
    init() {
      this.pageIndex = 1
    },
    pageChange(e) {
      this.pageIndex = e
    },
    sizeChange(e) {
      this.pageIndex = 1
      this.pageSize = e
    }
  }
}
</script>
