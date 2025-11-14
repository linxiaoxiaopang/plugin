<template>
  <el-pagination
    :class="[comstomClass]"
    :current-page.sync="pagingInfo.page"
    :page-sizes="sizes"
    :page-size="pagingInfo.size"
    :total="total"
    :background="$attrs.background === undefined ? true : $attrs.background"
    :layout="layout"
    :hide-on-single-page="isHideOnSinglePage"
    v-bind="$attrs"
    @current-change="handleCurrentChange"
    @size-change="handleSizeChange"
  >
    <template>
      <slot
        name="layout"
        :scoped="{
          curPage: pagingInfo.page,
          total,
          totalPage: Math.ceil(total / pagingInfo.size)
        }"
      ></slot>
    </template>
  </el-pagination>
</template>
<script>
export default {
  props: {
    comstomClass: {
      type: String,
      default: 'defaultClass'
    },
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper, slot'
    },
    hideOnSinglePage: {
      type: Boolean,
      default: false
    },
    page: Number,
    size: Number,
    total: Number,
    type: String,
    fSize: {
      type: Array,
      default: () => [10, 20, 50, 200]
    }
  },
  data() {
    return {
      isHideOnSinglePage: true,
      pagingInfo: {
        page: 1,
        size: this.size || this.fSize[0]
      },
      sizes: this.fSize
    }
  },
  computed: {
    pageOption({ page, size, pagingInfo: { size: curSize } }) {
      return {
        page: page,
        size: size || curSize
      }
    }
  },
  watch: {
    hideOnSinglePage: {
      handler() {
        this.isHideOnSinglePage = this.hideOnSinglePage
      },
      immediate: true
    },
    pageOption: {
      handler(n) {
        this.pagingInfo.page = n.page
        this.pagingInfo.size = n.size
      },
      immediate: true,
      deep: true
    }
  },

  methods: {
    reFreshpage(page) {
      this.pagingInfo.page = page
    },
    handleSizeChange(val) {
      this.isHideOnSinglePage = false
      this.pagingInfo.size = val
      this.pagingInfo.page = 1
      this.$emit('refreshTableEventFun', this.pagingInfo)
    },
    handleCurrentChange(val) {
      this.$emit('refreshTableEventFun', this.pagingInfo)
    }
  }
}
</script>
<style lang="scss" scoped>
.defaultClass.el-pagination {
  text-align: right;
  // border: 1px solid $border-color;
  background: #fff;
  border-top: none;
  padding: 10px 0;
  padding-right: 15px;
}
</style>
