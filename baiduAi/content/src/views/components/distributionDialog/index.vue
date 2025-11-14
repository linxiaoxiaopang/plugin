<template>
  <appDialog
    @submit="onsubmit"
    @close="onclose"
    customClass="distribution-dialog-component-custom-class"
    v-bind="allDialogOption"
    v-on="new$Listeners"
  >
    <el-tabs class="flex-one" v-model="curValue">
      <el-tab-pane :key="index" :label="item.label" :name="item.value" v-for="(item, index) in list">
        <component class="content-body"
                   :class="[!showCheckAll && 'hide-check-all']"
                   :ref="`${item.value}Body`"
                   :is="componentName"
                   :option="item.option"
                   :getList="item.getList"
                   :checkAll="true"
                   :isHandleRealData="true"
                   :isReserveSelection="true"
                   :resetMergeData="item.resetMergeData"
                   @toggleSelectionData="toggleSelectionData">
          <template v-for="(item, name) in $scopedSlots" #[name]="scoped">
            <slot :name="name" v-bind="scoped"></slot>
          </template>
        </component>
      </el-tab-pane>
    </el-tabs>

    <el-divider></el-divider>
    <!-- 选择的原型列表 -->
    <div class="mt10 mb10">
      已选择{{ curBodyOption.label }}
      <color-text-btn @click="onClear">取消全部（{{ selectionDataCount }}）</color-text-btn>
    </div>
    <div class="distribution-dialog-infinite-scroll-wrapper">
      <InfiniteScroll
        v-if="data.length"
        :data="data"
        ref="infiniteScrollEl"
        @item-change="toggleRowSelection"
        v-bind="allInfiniteScrollOption"
      >
        <template #default="scoped">
          <slot name="infiniteScrollItem" v-bind="scoped">
            slot
          </slot>
        </template>
      </InfiniteScroll>
    </div>
  </appDialog>
</template>

<script>
import InfiniteScroll from '@/views/components/infiniteScroll'
import { dialogDefaultOption, bodyDefaultOption, infiniteScrollDefaultOption } from './const'
import { isArray, isPlainObject, merge, isFunction, flatten } from 'lodash'
import { getSplitAttrs } from '@/utils'

const PREFIX_LIST = {
  dialog: 'dialogOption',
  body: 'bodyOption',
  infiniteScroll: 'infiniteScrollOption',
  default: 'dialog'
}

export default {
  components: {
    InfiniteScroll
  },

  props: {
    defaultSelection: {
      type: Array,
      default: () => []
    },

    dialogConfig: {
      type: Object,
      default: () => ({})
    },

    bodyConfig: {
      type: Object,
      default: () => ({}),
      validator(value) {
        if (!isPlainObject(value)) return false
        if (isArray(value.column)) {
          return value.column.every(item => {
            return item.label && item.value
          })
        }
        return value.label && value.value
      }
    },

    infiniteScrollConfig: {
      type: Object,
      default: () => ({})
    },

    validSelectionDataAll: {
      type: [Boolean, Function],
      default: true
    },

    showCheckAll: Boolean
  },

  data() {
    return {
      curValue: '',
      allData: {}
    }
  },

  computed: {
    componentName() {
      return 'baseTable'
    },

    new$Listeners({ $listeners }) {
      const { submit, close, ...rest$Listeners } = $listeners
      return rest$Listeners
    },

    split$Attrs({ $attrs }) {
      return getSplitAttrs($attrs, PREFIX_LIST)
    },

    allDialogOption({ dialogConfig, split$Attrs }) {
      return merge({}, dialogDefaultOption, split$Attrs.dialogOption, dialogConfig)
    },

    allBodyOption({ bodyConfig }) {
      return merge({}, bodyDefaultOption, bodyConfig)
    },

    allInfiniteScrollOption({ infiniteScrollConfig, split$Attrs }) {
      return merge({}, infiniteScrollDefaultOption, split$Attrs.infiniteScrollOption, infiniteScrollConfig)
    },

    list({ allBodyOption }) {
      if (isArray(allBodyOption.column)) return allBodyOption.column
      return [allBodyOption]
    },

    curBodyOption({ list, curValue }) {
      if (!curValue) return {}
      return list.find(item => item.value == curValue)
    },

    curBodyInstance({ curBodyOption }) {
      const prop = `${curBodyOption.value}Body`
      const bodyRefs = this.$refs[prop]
      if (isArray(bodyRefs)) return bodyRefs[0]
      return bodyRefs
    },

    data: {
      get({ allData, curValue }) {
        if (!curValue) return []
        return allData[curValue].filter(Boolean)
      },
      set(newVal) {
        this.allData[this.curValue] = newVal || []
      }
    },

    flatData({ allData }) {
      return flatten(Object.values(allData))
    },

    selectionDataCount({ allData, curValue }) {
      if (!curValue) return 0
      return allData[curValue].length
    }
  },

  watch: {
    list: {
      handler(newVal) {
        const tmpObj = newVal.reduce((cur, prev) => {
          cur[prev.value] = []
          if (!this.allData[prev.value]) {
            this.$delete(this.allData, prev.value)
          }
          return cur
        }, {})
        this.allData = Object.assign({}, this.allData, tmpObj)
        if (!this.curValue || !this.allData[this.curValue]) {
          this.curValue = newVal[0].value
        }
      },
      immediate: true
    },

    defaultSelection: {
      handler(newVal) {
        if (!newVal) return
        if (isPlainObject(newVal)) {
          return merge(this.allData, newVal)
        }
        this.data = merge(this.data, newVal)
      },
      immediate: true
    }
  },

  methods: {
    async onsubmit(curValue, done) {
      if (isFunction(this.validSelectionDataAll)) {
        const isNext = await this.validSelectionDataAll()
        if (!isNext) return done(false)
      } else if (!this.flatData.length && this.validSelectionDataAll) {
        this.$message.warning('请先选择数据')
        return done(false)
      }
      this.$emit('submit', this.allData, done, this)
    },

    toggleSelectionData(data) {
      this.data = data
    },

    toggleRowSelection(row) {
      this.curBodyInstance.toggleRowSelection([row], false)
    },

    onclose() {
      const defaultClose = () => {
        Object.assign(this, this.$options.data.call(this))
        this.curValue = $GET(this.list, '0.value', '')
        this.allData = this.resetAllData()
      }
      if (this.$listeners.close) {
        this.$emit('close', defaultClose, this)
        return
      }
      defaultClose()
    },

    resetAllData() {
      return this.list.reduce((cur, prev) => {
        cur[prev.value] = []
        return cur
      }, {})
    },

    onClear() {
      this.curBodyInstance.clearSelection()
    }
  }
}

</script>
<style lang="scss">
.distribution-dialog-component-custom-class {
  .el-tabs {
    overflow-y: auto;
  }

  .content-body {
    min-height: 100px;
  }

  .distribution-dialog-infinite-scroll-wrapper {
    height: 100px;
    max-height: 300px;
    border-bottom: 1px solid $border-color;
  }

  .hide-check-all {
    .crud-check-all {
      display: none;
    }
  }
}

</style>

