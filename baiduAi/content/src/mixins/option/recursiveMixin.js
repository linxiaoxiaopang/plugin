/* eslint-disable */
import props from '@/mixins/dic/props'
import { validatenull } from '@/components/avue/utils/validate'
import { validData } from '@/components/avue/utils/util'
import { getTabAllLevels, getTabsOption, getTabValues } from '@/components/base/baseTabs/util'
import { find, last } from 'lodash'

export default {
  mixins: [props],
  props: {
    value: {
      default: ''
    },
    option: {
      type: Array | Object,
      default: () => {
        return []
      }
    },
    showAllLevels: Boolean
  },
  data() {
    return {
      curValue: '',
      childValue: []
    }
  },
  computed: {
    finalValue: {
      get({ curValue, childValue }) {
        return [curValue].concat(childValue)
      },
      set(value) {
        value = Array.isArray(value) ? value : []
        this.curValue = value[0] ?? this.defaultValue
        this.childValue = value.slice(1)
      }
    },
    lastValue() {
      return last(this.finalValue)
    },
    defaultValue({ finalOption: { defaultValue, column } }) {
      return validData(defaultValue, column[0]?.[this.dictValue])
    },
    finalOption({ option }) {
      return getTabsOption(option)
    },
    tabAllLevels() {
      return getTabAllLevels(this.finalOption)
    },
    curItem({ finalOption: { column }, curValue }) {
      return find(column, { [this.dictValue]: curValue }) || {}
    },
    children({ curItem }) {
      return curItem.children
    },
    columnOption() {
      return getTabValues(this.finalOption)
    },
    curTabItem() {
      return this.columnOption[this.lastValue] || {}
    },
    allLevelsItem() {
      return this.tabAllLevels[this.lastValue].map(value => this.columnOption[value] || {})
    }
  },
  watch: {
    defaultValue: {
      handler(defaultValue) {
        // value无值或值不是tab的value时，设置为默认值
        if (!validatenull(this.value) && this.isColumnValue(this.finalOption, this.value)) return
        
        this.curValue = defaultValue
        this.handleChange()
        this.defaultValueLock = true
        this.$nextTick(function () {
          this.defaultValueLock = false
        })
      },
      immediate: true
    },
    children: {
      handler(n) {
        if (!this.isColumnValue(n, this.childValue)) this.childValue = []
      },
      immediate: true
    },
    value: {
      handler(value) {
        // value无值时，设置为默认值
        if (validatenull(value) && this.defaultValueLock) return
        this.finalValue = this.showAllLevels ? value : this.tabAllLevels[value]
      },
      immediate: true,
      deep: true
    },
    finalOption: {
      handler(n, o) {
        if (this.defaultValueLock) return
        const nColumn = n?.column
        const oColumn = o?.column
        if (!validatenull(nColumn) && validatenull(oColumn)) {
          this.setValueOnDicChange()
        }
      },
      immediate: true
    },
    curTabItem: {
      handler(n) {
        this.$emit('update:curTabItem', n)
      },
      immediate: true
    }
  },
  methods: {
    handleChange() {
      // console.log('handleChange', this.curValue)
      let { finalValue } = this
      finalValue = this.showAllLevels ? finalValue : finalValue.slice(-1)[0]
      this.$emit('input', finalValue)
      this.$emit('change', finalValue)
      this.$emit('search-change', finalValue)
    },
    
    isColumnValue(option, value) {
      const { column } = getTabsOption(option) || {}
      return !!find(column, { [this.dictValue]: [].concat(value)[0] })
    },
    
    setValueOnDicChange() {
      // console.log(this.curValue, 'created')
      // 立即执行一次change，为了设置默认值
      let isFirst = true
      let unwatch
      unwatch = this.$watch(
        'finalValue',
        (finalValue) => {
          // console.log(this.curValue, finalValue)
          typeof unwatch === 'function' && unwatch()
          // 如果有children，就由子组件触发change
          if (!this.children && isFirst) {
            isFirst = false
            this.handleChange(finalValue)
          }
        },
        {
          immediate: true
        }
      )
    }
  }
}