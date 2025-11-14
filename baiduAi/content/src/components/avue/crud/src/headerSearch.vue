<template>
  <div v-if="showHeaderSearch" ref="headerSearch" class="crud-header">
    <!--v-show="searchFlag && showSearch"-->
    <el-form
      ref="searchForm"
      class="el-row formPart"
      :class="{ 'label-width-auto': option.isSearchAuto }"
      :model="searchForm"
      :size="option.searchSize || DEFAULT_TABLE_SIZE"
      :label-width="setPx(option.searchLabelWidth, 'auto')"
      :label-suffix="labelSuffix"
      @submit.native.prevent
    >
      <!-- 循环列搜索框 -->
      <el-col
        v-for="(column, index) in searchColumn"
        :key="column.prop"
        :md="column.searchSpan || 6"
        :xs="24"
        :span="24"
        :offset="column.offset || 0"
        :pull="column.pull"
        :style="{ width: setPx(column.searchWidth, option.isSearchAuto && 'auto') }"
        :class="{ 'is-search-auto': option.isSearchAuto }"
      >
        <el-form-item
          :label="column.searchLabel"
          :prop="column.prop"
          :label-width="setPx(column.searchLabelWidth, 'auto')"
        >
          <slot
            v-if="vaildData(column.searchFormSlot, column.searchSlotName)"
            v-bind="handleBindColumn(column)"
            :name="column.searchSlotName || `${column.prop}SearchForm`"
            :dic="setDic(column, DIC)"
            :form="searchForm"
            :label="column.searchLabel"
            :prop="column.prop"
            :props="column.props"
            :size="option.searchSize || DEFAULT_TABLE_SIZE"
            :placeholder="column.searchPlaceholder"
            :searchChange="searchChange"
          ></slot>
          <component
            v-else
            :is="components[column.type] || components[column.searchType] || getSearchType(column.type)"
            v-model="searchForm[column.prop]"
            :form="searchForm"
            :column="column"
            :defaultValue="column.defaultValue"
            :type="column.type"
            :size="option.searchSize || DEFAULT_TABLE_SIZE"
            :valueFormat="column.valueFormat"
            :label="column.searchLabel"
            :prefix-icon="column.searchPrefixIcon"
            :placeholder="column.searchPlaceholder"
            :props="column.props"
            :dic="setDic(column, DIC)"
            :border="column.border"
            :minRows="column.minRows"
            :maxRows="column.maxRows"
            :controls="column.controls"
            :controls-position="column.controlsPosition"
            :emitPath="column.emitPath"
            :checkStrictly="column.checkStrictly"
            :show-all-levels="column.showAllLevels"
            @input="handleChange"
            @search-change="searchChange"
            v-bind="handleBindColumn(column)"
          ></component>
        </el-form-item>
      </el-col>
      <el-col v-if="vaildData(option.btn, true)" :span="1.5" class="search-form-btn text-right nowrap">
        <el-form-item label-width="0">
          <el-button
            v-if="vaildData(option.searchBtn, true)"
            type="primary"
            @click="searchChange"
            :icon="vaildData(option.isSearchIcon, true) ? vaildData(option.searchIcon, 'el-icon-search') : ''"
            class="search-form-confirm"
            :size="option.searchSize || DEFAULT_TABLE_SIZE"
          >
            <template v-if="option.searchText">
              {{ option.searchText }}
            </template>
          </el-button>
          <el-button
            v-if="option.resetBtn"
            @click="searchReset"
            :icon="vaildData(option.isResetIcon, true) ? vaildData(option.resetIcon, 'el-icon-refresh') : ''"
            class="search-form-reset"
            :size="option.searchSize || DEFAULT_TABLE_SIZE"
          >{{ option.resetText || '重置' }}</el-button>
          <slot name="searchMenu"></slot>
        </el-form-item>
      </el-col>
    </el-form>
  </div>
</template>

<script>
import { DEFAULT_TABLE_SIZE } from '../../utils/const/config'
import { validatenull } from '../../utils/validate'
import crud from '../../mixins/crud'
import dateTimePicker from '@/components/base/baseTable/module/dateTimePicker'
import dateTimePicker1 from '@/components/base/baseTable/module/dateTimePicker1'
import selectInput from '@/components/base/baseForm/module/selectInput'
import rangeInput from '@/components/base/baseTable/module/rangeInput'
import { validData } from '@/components/avue/utils/util'

export default {
  name: 'crudHeaderSearch',
  mixins: [crud()],
  inject: {
    crud: {
      default: () => {}
    }
  },
  props: {
    search: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      DEFAULT_TABLE_SIZE,
      searchForm: {}
    }
  },
  computed: {
    option() {
      return this.$attrs.option || this.crud?.option || {}
    },
    searchColumn() {
      return this.option.column.filter((column) => {
        column.searchLabel = this.vaildData(column.searchLabel, column.label)
        if (!column.searchLabel) {
          column.searchLabelWidth = this.vaildData(column.searchLabelWidth, 0)
        }

        return column.search
      })
    },
    DIC() {
      return {
        ...this.$attrs.dic,
        ...this.option.dic,
        ...this.crud?.DIC
      }
    },

    searchFlag() {
      return !validatenull(this.searchForm)
    },
    showHeaderSearch() {
      return this.searchFlag
    },

    labelSuffix({ option: { searchLabelSuffix } }) {
      if (typeof searchLabelSuffix === 'boolean') return searchLabelSuffix ? '：' : ''
      return validData(searchLabelSuffix, '：')
    },

    autosearch() {
      return validData(this.$attrs.autosearch, this.option.autosearch, true)
    },

    components() {
      return {
        dateTimePicker,
        dateTimePicker1,
        selectInput,
        rangeInput
      }
    }
  },
  watch: {
    search: {
      handler (search) {
        this.searchForm = Object.assign(this.searchForm, search)
      },
      immediate: true,
      deep: true
    },
    option: {
      handler(n, o) {
        if (n !== o) {
          //初始化表单
          this.formInit()
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    formInit() {
      const list = this.option.column
      let form = {}
      let searchForm = {}
      list.forEach((ele) => {
        if (['checkbox', 'daterange', 'cascader'].includes(ele.type)) {
          form[ele.prop] = []
          if (ele.search) {
            searchForm[ele.prop] = []
          }
        } else if (ele.type == 'number') {
          form[ele.prop] = 0
          if (ele.search) {
            searchForm[ele.prop] = 0
          }
        } else {
          form[ele.prop] = ''
          if (ele.search) {
            searchForm[ele.prop] = ''
          }
        }
        if (!validatenull(ele.value)) form[ele.prop] = ele.value
        if (!validatenull(ele.searchValue)) searchForm[ele.prop] = ele.searchValue
      })
      this.searchForm = Object.assign({}, searchForm, this.search)
      this.handleChange()

      !this.isSearchInit && this.searchInit()
      this.isSearchInit = true
    },
    // 解决searchForm默认值未设置即发起请求
    searchInit() {
      this.$emit('search-init', this.searchForm)
      this.crud?.$emit('search-init', this.searchForm)
    },

    handleChange() {
      this.$emit('update:search', this.searchForm)
      this.crud?.$emit('update:search', this.searchForm)
    },
    //搜索回调
    searchChange(trigger) {
      if (trigger !== 'btn' && !this.autosearch) return

      this.$emit('search-change', this.searchForm)
      this.crud?.$emit('search-change', this.searchForm)
    },
    //搜索清空
    searchReset() {
      this.$refs['searchForm'].resetFields()
      this.$emit('search-reset', this.searchForm)
      this.crud?.$emit('search-reset', this.searchForm)
    },

    validate(callback) {
      return this.$refs.searchForm.validate(callback)
    },

    handleBindColumn(column) {
      const { DIC } = this
      const tmpObj = {}
      if (column.dicTypes) {
        for (const key in column.dicTypes) {
          tmpObj[key] = DIC[key]
        }
      }

      return {
        ...tmpObj,
        ...column,
        slot: undefined,
        $sort: undefined,
        $sortKey: undefined
      }
    },

    validData
  }
}
</script>

<style lang="scss" scoped>
.is-search-auto {
  ::v-deep {
    .avue-crud-date {
      width: 288px;
    }
  }
}
</style>