<template>
  <InfiniteScroll
    class="checkbox-img"
    :gutter="gutter"
    :span="span"
    :isShowLoading="false"
    :isLoadForScroll="true"
    :data="infiniteScrollData"
    :total="total"
    @load="load"
  >
    <template v-slot="{ data }">
      <check-box-slot
        :checked="true"
        @change="itemChange(data)"
      >
        <slot :row="data">
        </slot>
      </check-box-slot>
    </template>
  </InfiniteScroll>
</template>

<script>
import InfiniteScroll from '@/components/infiniteScroll'
import checkBoxSlot from '@/components/checkBoxSlot'

export default {
  components: {
    InfiniteScroll,
    checkBoxSlot
  },
  model: {
    prop: 'data',
    event: 'change'
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    type: String,
    pageSize: Number,
    gutter: {
      type: Number,
      default: 15
    },
    span: {
      type: Number,
      default: 4
    },
    imageHeight: {
      default: '100%'
    },
    isDeleteOnCancel: Boolean,
    rowKey: {
      type: String,
      default: 'id'
    }
  },
  data() {
    return {
      allData: [],
      infiniteScrollPage: {
        pageIndex: 1,
        pageSize: 12
      }
    }
  },
  computed: {
    infiniteScrollData({ allData, infiniteScrollPage: { pageIndex, pageSize } }) {
      return allData.slice(0, pageIndex * pageSize)
    },
    getAllData({ data }) {
      return this.isDeleteOnCancel ? [...data] : data
    },
    total() {
      return this.allData.length
    }
  },
  watch: {
    allData: {
      handler(n) {
        let {
          infiniteScrollPage: { pageIndex, pageSize },
          infiniteScrollPage
        } = this
        let maxPage = Math.ceil(n.length / pageSize)
        // pageIndex最小为1，否则load不生效
        if (pageIndex > maxPage) infiniteScrollPage.pageIndex = Math.max(maxPage, 1)
      },
      deep: true
    },
    getAllData: {
      handler(n) {
        this.allData = n
      },
      immediate: true
    },
    pageSize: {
      handler(n) {
        let pageSize
        if (n) {
          pageSize = n
        } else {
          const { span } = this
          pageSize = Math.floor(24 / span * 2)
        }
        this.infiniteScrollPage.pageSize = pageSize
      },
      immediate: true
    }
  },
  methods: {
    itemChange(data) {
      if (this.isDeleteOnCancel) {
        this.pull(this.allData, data)
        this.$emit('change', this.allData)
      }
      this.$emit('item-change', data)
    },
    load() {
      this.infiniteScrollPage.pageIndex++
    },

    pull(list, row) {
      const index = this.findIndex(list, row)
      index > -1 && list.splice(index, 1)
      return list
    },
    findIndex(list, row) {
      return list.findIndex(item => this.isEqual(item, row))
    },
    isEqual(data1, data2) {
      if (data1 === data2) return true

      let { rowKey } = this
      return data1?.[rowKey] === data2?.[rowKey]
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
