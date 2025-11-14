import Sortable from 'sortablejs'
import { validatenull } from '@/components/avue/utils/validate'
import { isPlainObject, merge, isUndefined, isString } from 'lodash'

export default {
  inserted(el, binding, vNode) {
    const defaultOption = {
      container: '.el-table__body-wrapper tbody',
      dataProp: 'tableData',
      rowKey: 'id',
      sortProp: 'sortNumber',
      handle: '.draggable-btn',
      onStart() {
        const { container, handle } = finalOption
        oldDomList = querySelectorAllInContainer(container, handle)
      },

      onEnd() {
        const result = {
          oldData: [],
          newData: []
        }
        const { container, handle, rowKey, onAfterDrag, dataProp, sortProp } = finalOption
        newDomList = querySelectorAllInContainer(container, handle)
        newDomList.map((item, index) => {
          const fIndex = oldDomList.findIndex(oldItem => item == oldItem)
          const oldRow = context[dataProp][index]
          const newRow = context[dataProp][fIndex]
          const oldItem = result.oldData[index] = {
            row: oldRow
          }
          const newItem = result.newData[index] = {
            row: newRow
          }
          if (!isUndefined(oldRow[rowKey]) && !isUndefined(newRow[rowKey])) {
            oldItem[rowKey] = oldRow[rowKey]
            newItem[rowKey] = newRow[rowKey]
          }
          if (!isUndefined(oldRow[sortProp]) && !isUndefined(newRow[sortProp])) {
            oldItem[sortProp] = oldRow[sortProp]
            newItem[sortProp] = oldRow[sortProp]
          }
        })
        onAfterDrag(result)
      },

      onAfterDrag(result) {
        const { sortProp, dataProp } = finalOption
        const newData = result.newData || []
        context[dataProp].length = 0
        newData.map(item => {
          const { row } = item
          if (!isPlainObject(row)) {
            context[dataProp].push(row)
            return
          }
          context[dataProp].push({
            ...row,
            [sortProp]: item[sortProp]
          })
        })
      }
    }

    let oldDomList = []
    let newDomList = []
    let sortable = null
    let { value: option } = binding
    if (!isPlainObject(option)) {
      option = {
        onAfterDrag: option
      }
    }
    const finalOption = merge({}, defaultOption, option)
    let { container = el, handle, dataProp, onAfterDrag } = finalOption
    if (!handle) {
      throw new Error('缺少必要参数 handle')
    }
    const context = vNode.context
    el.unWatch = context?.$watch(() => {
      return context[dataProp]
    }, (newVal) => {
      if (validatenull(newVal)) return
      context.$nextTick(() => {
        sortable && sortable.destroy()
        finalOption.container = isString(container) ? el.querySelector(container) : container
        finalOption.onAfterDrag = isString(onAfterDrag) ? context[onAfterDrag] : onAfterDrag
        sortable = Sortable.create(finalOption.container, finalOption)
      })
    }, {
      immediate: true
    })
  },

  unbind(el) {
    el.unWatch && el.unWatch()
  }
}

function querySelectorAllInContainer(container, selector) {
  const selectors = container.querySelectorAll(selector)
  if (!selectors) return []
  return [...selectors]
}
