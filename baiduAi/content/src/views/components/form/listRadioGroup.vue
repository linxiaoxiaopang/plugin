<template>
  <div class="search-radio-group">
    <div v-show="!openMore" class="search-radio-init">
      <el-radio-group
        v-if="!openMore"
        v-model="curVal"
        size="mini"
      >
        <el-radio
          v-if="hasAll"
          border
          :label="allValue"
          @click.native.prevent="handleClick(allValue)"
        >{{ allText }}</el-radio>
        <el-radio
          v-for="(item, index) in sliceList.list[0]"
          :key="index"
          :label="item[props.value]"
          border
          @click.native.prevent="handleClick(item[props.value])"
        >
          {{ item[props.label] }}
        </el-radio>
      </el-radio-group>
    </div>
    <el-card v-if="sliceList.isMore" v-show="openMore" shadow="never" style="margin-bottom: 4px;">
      <div class="card-header">
        <el-radio-group
          v-if="curSearchList.length"
          v-model="curSearchType"
          size="mini"
        >
          <el-radio label="all" border>全部</el-radio>
          <el-radio
            v-for="(item, index) in curSearchList"
            :key="index"
            :label="item[searchProps.value]"
            border
            @click.native.prevent="handleSearchClick(item[searchProps.value])"
          >
            {{ item[searchProps.label] }}
          </el-radio>
        </el-radio-group>
        <div v-else></div>
        <el-input
          v-model="moreSearchInput"
          size="small"
          suffix-icon="el-icon-search"
          placeholder="输入关键字"
        >
        </el-input>
      </div>

      <el-radio-group v-model="curVal" size="mini">
        <el-radio
          v-if="hasAll"
          border
          :label="allValue"
          @click.native.prevent="handleClick(allValue)"
        >{{ allText }}</el-radio>
        <el-radio
          v-for="(item, index) in moreList"
          :key="index"
          :label="item[props.value]"
          border
          @click.native.prevent="handleClick(item[props.value])"
        >
          {{ item[props.label] }}
        </el-radio>
      </el-radio-group>
    </el-card>
    <more-btn v-if="sliceList.isMore" v-model="openMore"></more-btn>
  </div>
</template>

<script>
import moreBtn from './moreBtn'
export default {
  components: {
    moreBtn
  },
  props: {
    // 绑定值
    value: {},
    // 单选列表字典
    list: {
      type: Array,
      default: () => []
    },
    hasAll: {
      type: Boolean,
      default: true
    },
    allValue: {
      type: String,
      default: 'all'
    },
    allText: {
      type: String,
      default: '全部'
    },
    // 收缩时按钮展示数量
    topSize: {
      type: Number,
      default: 10
    },
    // label: 字典的名称属性值
    // value: 字典的值属性值
    props: {
      type: Object,
      default() {
        return {
          label: 'label',
          value: 'value'
        }
      }
    },
    // 展开后，搜索框字段
    searchInputProp: String,
    // 展开后，搜索单选默认值
    searchType: {
      default: 'all'
    },
    // 展开后，搜索单选列表字典
    searchList: {
      type: Array,
      default: () => []
    },
    // 展开后，搜索单选列表字典
    // label: 字典的名称属性值
    // value: 字典的值属性值
    searchProps: {
      type: Object,
      default() {
        return {
          label: 'label',
          value: 'value'
        }
      }
    },
    // 展开后，搜索单选列表字段
    searchRadioProp: String,
    dic: {},
    dicData: {},
    column: {}
  },
  data() {
    return {
      moreSearchInput: '',
      openMore: false,
      curVal: '',
      curSearchType: ''
    }
  },
  computed: {
    // 收缩时，单选列表字典
    sliceList({ list, topSize }) {
      return {
        topSize,
        // 展开按钮是否显示
        isMore: list.length > topSize,
        // 根据topSize，将单选列表字典切割成两份
        list: [list.slice(0, topSize), list.slice(topSize)]
      }
    },
    // 展开时，单选列表字典
    moreList({ sliceList, validateBySearchInput, validateBySearchRadio }) {
      let allSliceList = []
      allSliceList = allSliceList.concat(sliceList.list[0], sliceList.list[1])
      return allSliceList.filter(
        (item) => validateBySearchInput(item) && validateBySearchRadio(item)
      )
    },
    // 通过搜索框值，验证字典项是否正确（筛选单选列表字典）
    validateBySearchInput({ curSearchInputProp, moreSearchInput }) {
      let regExp = new RegExp(moreSearchInput, 'img')
      return (item) => {
        regExp.lastIndex = 0
        return regExp.test(item[curSearchInputProp])
      }
    },
    // 搜索框字段
    curSearchInputProp({ props, searchInputProp }) {
      return  searchInputProp || props.label
    },
    // 通过搜索单选值，验证字典项是否正确（筛选单选列表字典）
    validateBySearchRadio({ curSearchRadioProp, curSearchType }) {
      let regExp = new RegExp(
        curSearchType === 'all' ? '' : curSearchType,
        'img'
      )
      return (item) => {
        regExp.lastIndex = 0
        return regExp.test(item[curSearchRadioProp])
      }
    },
    // 搜索单选字段
    curSearchRadioProp({ searchProps, searchRadioProp }) {
      return searchRadioProp || searchProps.value
    },
    // 展开后，搜索单选列表字典
    curSearchList({ searchList }) {
      // console.log(searchList)
      return searchList.slice(0, 7)
    },

    defaultValue() {
      if (!this.hasAll) return this.list[0]?.value
      return this.allValue
    }
  },
  watch: {
    value: {
      handler(n) {
        this.curVal = n
      },
      immediate: true
    },
    searchType: {
      handler(n) {
        this.curSearchType = n
      },
      immediate: true
    },
    curSearchType(n) {
      this.$emit('update:searchType', n)
    }
  },
  methods: {
    onchange(val) {
      // console.log(val)
      this.curVal = val
      this.$emit('input', val)
      this.$emit('change', val)
      this.$emit('search-change', val)
    },
    handleClick(val) {
      if (this.curVal === val) {
        this.onchange(this.defaultValue)
      } else {
        this.onchange(val)
      }
      // console.log(val)
    },
    handleSearchClick(val) {
      if (this.curSearchType === val) {
        this.curSearchType = 'all'
      } else {
        this.curSearchType = val
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.search-radio-group {
  $line-height: $form-line-height;
  $radio-height: $form-item-height;
  $wrap-top: 4px;
  $radio-top: 0;
  $radio-left: 0;
  $more-btn-width: 70px;

  position: relative;
  width: 100%;
  height: 100%;
  margin-right: 5.5%;
  .search-radio-init {
    width: 100%;
    padding-right: $more-btn-width;
    .el-radio-group {
      display: flex;
      flex-wrap: wrap;
    }
  }
  .more-btn {
    position: absolute;
    top: $wrap-top;
    right: 0;
    color: $color-content;
  }
  ::v-deep {
    .el-card {
      $radio-group-top: 8px;

      margin-top: -$wrap-top;
      margin-right: $more-btn-width;
      .el-card__body {
        padding: 0;
      }
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: $radio-height + 2 * $wrap-top;
        padding: 0 20px;
        background-color: #f7f8fa;
        .el-radio-group {
          margin-left: -20px;
          white-space: nowrap;
          overflow: hidden;
        }
        .el-radio {
          border-color: #e6e6e6;
          &.is-bordered.is-checked {
            border-color: #3841db;
          }
        }
        .el-input {
          width: 300px;
        }
      }
      .el-radio-group {
        $min-height: $radio-group-top * 2 + $radio-height;
        min-height: $min-height;
        max-height: $min-height * 2;
        padding: ($radio-group-top - $radio-top) 16px;
        overflow: auto;
      }
    }
    .el-radio.is-bordered {
      height: $radio-height;
      line-height: $radio-height;
      padding: 0 12px;
      margin: $radio-top $radio-left;
      color: $color-content;
      font-weight: 400;
      border: none;
      border-radius: 4px;
      background-color: transparent;
      &.is-checked {
        background-color: #ebecff;
        .el-radio__label {
          color: $color-primary;
        }
      }

      .el-radio__input {
        display: none;
      }
      .el-radio__label {
        padding-left: 0;
        font-size: 14px;
      }
    }
  }
}
</style>
