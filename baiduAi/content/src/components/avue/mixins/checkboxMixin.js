import { validData } from '@/components/avue/utils/util'
import { map, difference, concat, find, uniq, isNumber } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'
import { diffIdList } from '@/utils/result/diff'

export default {
  props: {
    value: {
      default: () => {
        return []
      }
    },
    dic: {
      default: () => {
        return []
      }
    },
    props: {
      default: () => {
        return {
          label: 'label',
          value: 'id'
        }
      }
    },
    min: null,
    max: null,
    readonly: Boolean,
    disabled: Boolean,
    selectable: Function,
    checkAll: Boolean,
    reserveSelection: Boolean
  },
  data() {
    return {
      allData: [],
      checkedIdList: [],
      allCheckedIdList: [],
      
      checkboxMin: null,
      checkboxMax: null
    }
  },
  computed: {
    checkedList({ allCheckedIdList, allData, dictValue }) {
      return allData.filter(row => allCheckedIdList.includes(row[dictValue]))
    },
    checkableIdList() {
      return map(this.checkableList, this.dictValue)
    },
    checkableList({ dic, selectable }) {
      return typeof selectable === 'function' ? dic.filter((row, index) => selectable(row, index)) : dic
    },
    disabledIdList() {
      return map(this.disabledList, this.dictValue)
    },
    disabledList({ dic, selectable }) {
      return typeof selectable === 'function' ? dic.filter((row, index) => !selectable(row, index)) : []
    },
    dicIdList() {
      return map(this.dic, this.dictValue)
    },
    
    checkAllStatus({ dic, checkedCount, disabledCount, total }) {
      if (total <= 0 || validatenull(dic)) return { value: false }
      
      const count = checkedCount + disabledCount
      const checkAll = count >= total
      return {
        value: checkAll,
        indeterminate: checkedCount > 0 && count < total
      }
    },
    checkedCount() {
      return this.checkedIdList.length
    },
    disabledCount() {
      return this.disabledList.length
    },
    total() {
      return this.dic?.length
    },
    
    isDisabled({ readonly, disabled }) {
      return disabled || readonly
    },
    dictLabel() {
      return this.props.label || 'label'
    },
    dictValue() {
      return this.props.value || 'id'
    }
  },
  watch: {
    value: {
      handler(n) {
        this.allCheckedIdList = n
        if (!this.checkAll) this.checkedIdList = n
      },
      immediate: true,
      deep: true
    },
    dic: {
      handler(n) {
        if (this.checkAll && !validatenull(n)) {
          const idList = map(n, this.dictValue)
          this.checkedIdList = this.allCheckedIdList.filter(id => idList.includes(id))
        }
        
        if (this.reserveSelection) {
          this.merge(this.allData, this.dic)
          this.checkedIdListLock = true
          setTimeout(() => this.checkedIdListLock = false)
        } else {
          this.allData = this.dic
          this.allCheckedIdList = [...this.checkedIdList]
        }
        
        this.minChange()
        this.maxChange()
        this.handleChange()
      },
      immediate: true,
      deep: true
    },
    checkedIdList: {
      handler(n) {
        if (!this.checkedIdListLock) {
          let { allCheckedIdList } = this
          const { add, del } = diffIdList(n, this.oCheckedIdList)
          allCheckedIdList = concat(allCheckedIdList, add)
          allCheckedIdList = difference(allCheckedIdList, del)
          this.allCheckedIdList = uniq(allCheckedIdList)
        }
        
        this.oCheckedIdList = [...n]
      },
      immediate: true,
      deep: true
    },
    
    min: {
      handler(n) {
        this.checkboxMin = n
      },
      immediate: true
    },
    max: {
      handler(n) {
        this.checkboxMax = n
      },
      immediate: true
    }
  },
  methods: {
    handleChange() {
      const { allCheckedIdList } = this
      this.$emit('input', allCheckedIdList)
      this.$emit('change', allCheckedIdList)
    },
    toggleRowSelection(row, selected) {
      const id = row[this.dictValue]
      if (selected) {
        this.push(this.checkedIdList, id)
        this.push(this.allCheckedIdList, id)
      } else {
        this.pull(this.checkedIdList, id)
        this.pull(this.allCheckedIdList, id)
      }
      this.checkedIdListLock = true
      setTimeout(() => this.checkedIdListLock = false)
      
      this.push(this.allData, this.findRow(row))
    },
    clearSelection() {
      this.allData = [...this.dic]
      this.checkedIdList = []
      this.allCheckedIdList = []
      this.handleChange()
    },
    checkAllChange(checked) {
      // 当disabled的变化与选中项有关联，即同步发生改变时，input的checked状态不会被改变，导致半选状态勾选变为取消。
      checked = !this.checkAllStatus.value
      
      const { max } = this
      if (checked && isNumber(max)) {
        let { allCheckedIdList } = this
        const len = max - allCheckedIdList.length
        if (len > 0) {
          const { checkableIdList } = this
          const idList = []
          for (const id of checkableIdList) {
            allCheckedIdList.includes(id) || idList.push(id)
            if (idList.length === len) break
          }
          allCheckedIdList = this.allCheckedIdList = allCheckedIdList.concat(idList)
          this.checkedIdList = checkableIdList.filter(id => allCheckedIdList.includes(id))
        }
      } else {
        this.checkedIdList = checked ? [...this.checkableIdList] : []
      }
      this.$nextTick(() => {
        this.handleChange()
        this.$emit('select-all', this.checkedList)
      })
    },
    
    minChange() {
      const { min } =  this
      if(isNumber(min)) {
        const { allCheckedIdList, dicIdList } = this
        const otherPageCheckedCount = allCheckedIdList.filter(id => !dicIdList.includes(id)).length
        let num = min - otherPageCheckedCount
        this.checkboxMin = Math.max(num, 0)
      }
    },
    maxChange() {
      const { max } =  this
      if(isNumber(max)) {
        const { allCheckedIdList, dicIdList } = this
        const otherPageCheckedCount = allCheckedIdList.filter(id => !dicIdList.includes(id)).length
        let num = max - otherPageCheckedCount
        this.checkboxMax = Math.max(num, 0)
      }
    },
    
    validData,
    findRow(row) {
      const { dictValue } = this
      return find(this.dic, { [dictValue]: row[dictValue] }) || row
    },
    merge(list1, list2) {
      this.push(list1, ...list2)
      return list1
    },
    push(list, ...rows) {
      rows.forEach((row) => {
        let index = this.findIndex(list, row)
        if (index > -1) {
          this.replace(list, index, row)
        } else {
          list.push(row)
        }
      })
      return list
    },
    pull(list, row) {
      const index = this.findIndex(list, row)
      index > -1 && list.splice(index, 1)
      return list
    },
    replace(list, index, row) {
      row && list[index] !== row && list.splice(index, 1, row)
    },
    findIndex(list, row) {
      return list.findIndex(item => this.isEqual(item, row))
    },
    isEqual(data1, data2) {
      if (data1 === data2) return true
      if ([data1, data2].some(value => ['string', 'number'].includes(typeof value))) return data1 === data2
      
      let { dictValue } = this
      return data1?.[dictValue] === data2?.[dictValue]
    }
  }
}
