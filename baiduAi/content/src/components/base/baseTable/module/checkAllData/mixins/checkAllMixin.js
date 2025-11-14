/* eslint-disable */
import { map, cloneDeep } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export default function () {
  return {
    data() {
      return {
        // 全部选中项
        selection: [],
        // 不可选列表（selectable为false，筛选出来的数据）
        // 不一定是全部的不可选数据，isHandleRealData为true时是，为false时为afterInit后从data筛选出
        nonselectableList: [],
        // 全选按钮的值：全选或半选都为true
        checkedAll: false,
        // 非全选时，数据为selectedList
        // 选择列表
        selectedList: [],
        // 全选时，数据为所有数据中排除unselectList的部分
        // 取消选择列表
        unselectList: []
      }
    },
    computed: {
      selectableList() {
        return this.getSelectableData(this.allList)
      },
      allList() {
        return this.allData || []
      },
      listTotal() {
        return this.allList.length
      },
      
      // indeterminate，控制全选按钮上的 一杠是否显示
      indeterminate() {
        if (this.checkedAll) {
          // 当全选按钮选中时，看看this.unselectList里有没有东西，有的话标识有东西没有选中，则返回true 没有就返回false
          return !!this.unselectList.length
        }
        // 当全选按钮没有选中时，this.selectedList 里有无选中项
        // 不用判断长度是否等于全部数据，因为一旦等于全部数据this.checkedAll会被设为true
        return !!this.selectedList.length
      },
    
      totalChange() {
        return {
          total: this.listTotal,
          selectedTotal: this.selectedTotal,
          nonselectableTotal: this.nonselectableTotal
        }
      },
      selectedTotal() {
        if (this.checkedAll) {
          return this.listTotal - this.unselectList.length - this.nonselectableTotal
        } else {
          return this.selectedList.length
        }
      },
      nonselectableTotal() {
        return this.nonselectableList.filter(item => !this.isSelectedData(item)).length
      },
    
      selectableData() {
        return this.getSelectableData(this.data)
      },
  
      selectionIdList() {
        return map(this.selection, this.rowKey)
      },
      
      defaultSelectionData() {
        return cloneDeep(this.defaultSelection || [])
      }
    },
    watch: {
      allList: {
        handler(allList) {
          this.nonselectableList = this.getNonselectableList(allList)
          this.initSelection()
        },
        immediate: true,
        deep: true
      },
  
      totalChange: {
        handler({ total, selectedTotal, nonselectableTotal }) {
          if (total === 0) return
      
          // 这里只改变checkedAll的状态
          const checkedAll = total === (selectedTotal + nonselectableTotal)
          // 只有checkedAll改变时才处理：全选时取消所有选择；checkedAll为false时勾选全部数据
          if (checkedAll !== this.checkedAll) {
            if (checkedAll) { // 为true时，可以直接改变
              this.checkedAllChange(true)
            } else if (selectedTotal === 0) { // false时，只有当selectedTotal为0才处理（全选时取消unselectList的情况）
              this.checkedAllChange(false)
            }
          }
        },
        immediate: true
      },
  
      defaultSelectionData: {
        handler(n) {
          if (validatenull(n)) return
          this.toggleSelection(n, true)
        },
        immediate: true
      }
    },
    methods: {
      handleSelect(selection, row) {
        this.toggleRowSelection(row, this.includes(selection, row))
      },
      handleSelectAll(selection) {
        this.selectableData.forEach(item => {
          if (this.includes(selection, item)) {
            this.addRowSelection(item)
          } else {
            this.clearRowSelection(item)
          }
        })
      },
    
      onchange(checked) {
        // 全选框为空选( { indeterminate: false, checkedAll: false } )时，checked = true
        // 全选框为半选( { indeterminate: true, checkedAll: true } | { indeterminate: true, checkedAll: false } )时，checked = true
        // 全选框为全选( { indeterminate: false, checkedAll: true } )时，checked = false
        const { indeterminate, checkedAll } = this
        checked = indeterminate || !checkedAll
      
        this.checkedAllChange(checked)
      },
      checkedAllChange(checkedAll) {
        if (checkedAll) {
          this.checkedAll = true // 是否会触发el-checkbox的change事件？否
          this.selectedList = []
          this.unselectList = []
          
          this.push(this.selection, ...this.selectableList)
        } else {
          this.clearSelection()
        }
        this.$emit('input', checkedAll)
      },
      
      // 返回调用方法时当前搜索条件下的选中项
      async getSelectionData() {
        if (this.checkedAll) {
          const { unselectList } = this
          const allSelectableData = this.selectableList
          return allSelectableData.filter(item => !this.includes(unselectList, item))
        } else {
          return [...this.selectedList]
        }
      },
      getSelectableData(data) {
        return data.filter(this.selectableFn)
      },
      getSelectedData(data = this.data) {
        return data.filter(this.isSelectedData)
      },
      getNonselectableList(data) {
        return data.filter(row => !this.selectableFn(row))
      },
      selectableFn(row) {
        return typeof this.selectable !== 'function' || this.selectable(row)
      },
  
      initSelection() {
        this.checkedAll = false // 是否会触发el-checkbox的change事件？否
        this.unselectList = []
        this.selectedList = this.intersection(this.selection, this.allList)
      },
      clearSelection() {
        this.pull(this.selection, ...this.selectableList)
  
        this.initSelection()
      },
      clearAllSelection() {
        this.selection = [...this.defaultSelectionData]
  
        this.initSelection()
      },
      toggleSelection(selection, selected) {
        selection.forEach(row => this.toggleRowSelection(row, selected))
      },
      toggleRowSelection(row, selected) {
        if (selected === undefined) {
          selected = !this.isSelectedData(row)
        }
      
        this[selected ? 'addRowSelection' : 'clearRowSelection'](row)
      },
      addRowSelection(row) {
        if (this.checkedAll) {
          this.pull(this.unselectList, row)
        } else {
          this.push(this.selectedList, row)
        }
        
        this.push(this.selection, row)
      },
      clearRowSelection(row) {
        if (this.checkedAll) {
          this.push(this.unselectList, row)
        } else {
          this.pull(this.selectedList, row)
        }
        
        this.pull(this.selection, row)
      },
      isSelectedData(row) {
        if (this.checkedAll) {
          return !this.includes(this.unselectList, row)
        } else {
          return this.includes(this.selectedList, row)
        }
      },
    
    
      intersection(list1, list2) {
        return list1.filter(item => this.includes(list2, item))
      },
      merge(list1, list2) {
        this.push(list1, ...list2)
        return list1
      },
      separate(list1, list2) {
        list2.forEach(item => this.pull(list1, item))
        return list1
      },
      push(list, ...rows) {
        rows.forEach((row) => {
          let index = this.findIndex(list, row)
          if (index > -1) {
            list.splice(index, 1, row)
          } else {
            list.push(row)
          }
        })
        return list
      },
      pull(list, ...rows) {
        rows.forEach((row) => {
          const index = this.findIndex(list, row)
          index > -1 && list.splice(index, 1)
        })
        return list
      },
      includes(list, row) {
        return list.some(item => this.isEqual(item, row))
      },
      find(list, row) {
        return list[this.findIndex(list, row)]
      },
      findIndex(list, row) {
        return list.findIndex(item => this.isEqual(item, row))
      },
      isEqual(data1, data2) {
        if (data1 === data2) return true
        
        let { rowKey = 'id' } = this
        let value1 = typeof data1 === 'object' ? data1[rowKey] : data1
        let value2 = typeof data2 === 'object' ? data2[rowKey] : data2
        
        return value1 === value2
      }
    }
  }
}
