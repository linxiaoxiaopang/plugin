/* eslint-disable */
import {
  findIndex,
  merge,
  get,
  isArray,
  isString,
  isFunction,
  isPlainObject,
  flatMapDeep,
  chain
} from 'lodash'
import { FormatObject } from '@/utils/format/object'
import Pipe from '@/utils/common/pipe'
import { vaildData } from '@/components/avue/utils/util'
import { setStaticComputed } from '@/utils'
import { validatenull } from '@/components/avue/utils/validate'

const defaultOption = {
  type: 'tree',
  spanProps: [],
  rowspanMap: {},
  
  isTitle: true,
  isExpanded: false,
  expandRow: 0, // 收起时，展示行数
  expandOn: '收起以上{length}项产品信息',
  expandOff: '展开剩余{length}项产品信息'
}
export class SpanUtils {
  constructor(option) {
    this.option = merge({}, defaultOption, option || {})
    this.option.isExpanded = vaildData(option?.isExpanded, this.option.expandRow > 0)
    const { flatMap } = this.option
    this.normalizedFlatMap = this.normalizeFlatMap(flatMap)
    
    this.getTabOption()
    
    setStaticComputed(this, {
      rowspanMap: () => {
        const result = {}
        const { rowspanMap } = this.option
        for (const parentProp in rowspanMap) {
          const spanProps = rowspanMap[parentProp]
          for (const prop of spanProps) {
            result[prop] = parentProp
          }
        }
        return result
      }
    })
  }
  
  getTabOption = () => {
    const creator = {
      tree: () => {
        return {
          handleTableData: this.flatMapDeep,
          spanMethod: this.createSpan(['titleSpan', 'createChildrenSpan'])
        }
      }
    }[this.option.type]
    const tabOption = creator()
    if (this.option.isExpanded) {
      merge(tabOption, this.treeTable)
    }
    if (tabOption.wrappedHandleTableData) {
      tabOption.handleTableData = tabOption.wrappedHandleTableData(
        tabOption.handleTableData
      )
    }
    return this.tabOption = tabOption
  }
  
  get columns() {
    return this.getColumns()
  }
  getColumns = (columns = this._columns) => {
    return this.shortTerm(
      () => getTrueColumns(columns) || []
    )
    
    function getTrueColumns(columns) {
      if (!columns) return
      return cb(columns)
      
      function cb(columns, result = []) {
        for (const column of columns) {
          if (column.children) {
            cb(column.children, result)
          } else {
            result.push(column)
          }
        }
        return result
      }
    }
  }
  
  indexes = {}
  getIndex = (property) => {
    return validValue(
      this.indexes[property],
      () => {
        return this.indexes[property] = findIndex(this.columns, { property })
      }
    )
  }
  getFirstDefaultIndex = () => {
    return validValue(
      this.indexes._firstDefaultIndex,
      () => {
        return this.indexes._firstDefaultIndex = findIndex(this.columns, { type: 'default' })
      }
    )
  }
  getLength = (start, end) => {
    return this.getIndex(end) - this.getIndex(start) + 1
  }
  getRestLengthByProp = (start) => {
    return this.columns.length - this.getIndex(start)
  }
  getRestLength = (index) => {
    return this.columns.length - index
  }
  
  
  // handleTableData
  // 注意：$parent和$children被使用（勿改）
  flatMapDeep = (data) => {
    let { normalizedFlatMap } = this
    if (!normalizedFlatMap?.length) return []
    
    let result = isArray(data) ? data : [data]
    return flatMapDeep(result, (item) => {
      // 最初数据 item
      let lastArr = [item]
      return normalizedFlatMap.map((map, i) => {
        const { path, emptyPath, handler, parentHandler, parentProp, fillProps, isRow = true } = map
        lastArr = flatMapDeep(lastArr, (lastItem, lastIndex) => {
          lastItem.$top = item
          
          let pathArr = getPathArr(lastItem, path)
          if (validatenull(pathArr) && emptyPath) pathArr = getPathArr(lastItem, emptyPath)
          lastItem.$children = pathArr
          if (validatenull(pathArr)) return []
          
          const pathLastIndex = pathArr.length - 1
          pathArr.forEach((pathItem, index) => {
            pathItem.$top = lastItem.$top
            pathItem.$isRow = isRow
            
            // 最初数据 不设置 $index
            if (pathItem !== item) {
              pathItem.$index = index
              pathItem.$isLast = index === pathLastIndex
            }
            // pathItem 设置上级对象字段（pathItem[`$${ parentProp }`]指向上级对象）
            pathItem.$parent = pathItem[`$${ parentProp }`] = lastItem
            // 继承父级的父级指向：总是能在最底层的子级找到最顶层的父级
            for (let j = i - 1; j >= 0; j--) {
              let { parentProp } = normalizedFlatMap[j]
              parentProp = `$${ parentProp }`
              pathItem[parentProp] = lastItem[parentProp]
            }
            // pathItem 处理
            if (fillProps) SpanUtils.fillProps(pathItem, lastItem, fillProps)
            SpanUtils.invoke(handler, pathItem, index, pathArr)
          })
          
          SpanUtils.invoke(parentHandler, lastItem, lastIndex, lastArr, pathArr)
          
          return pathArr
        })
        return isRow ? lastArr : []
      })
    })
    
    function getPathArr(item, path) {
      if (path === 'current') return [item]
      // 将当前行数据设置为title行数据
      if (path === 'isTitle') {
        item.$isTitle = true
        return [item]
      }
      let result
      if (isFunction(path)) {
        result = path(item)
      } else {
        result = get(item, path, [])
      }
      return SpanUtils.toArray(result)
    }
  }
  
  /**
   * @param: flatMap {[flatMapItem]}
   * @param: flatMapItem {path | [path | option, parentProp]}
   * @param: path {String} 行数据路径
   * @param: parentProp {String} 上级对象存储字段
   * @param: option { path, parentProp }
   * @return: [option]
   */
  normalizeFlatMap = (flatMap) => {
    return flatMap.map((item, i) => {
      const result = { parentProp: `parent${ i }` }
      if (isString(item)) {
        result.path = item
      } else if (isArray(item)) {
        result.path = item[0]
        if (isString(item[1])) result.parentProp = item[1]
      } else if (isPlainObject(item)) {
        Object.assign(result, item)
      }
      return result
    })
  }
  
  
  // spanMethod
  createSpan = (spanNames) => {
    const fns = spanNames.map(name => {
      if (/^create/.test(name)) return this[name]()
      return this[name]
    })
    const pipe = new Pipe({ fns })
    return (param, vm) => {
      this.initSpan(param, vm)
      return pipe.result(param, vm)
    }
  }
  initSpan = (param, vm) => {
    this.crud = vm
    this.table = vm.$refs.table || {}
    this._columns = this.table.store.states._columns
  }
  titleSpan = ({ row, columnIndex }) => {
    if (row.$isTitle) {
      const firstDefaultIndex = this.getFirstDefaultIndex()
      if (columnIndex < firstDefaultIndex) return [1, 1]
      const { titleEnd } = this.option
      if (titleEnd) {
        const titleEndIndex = this.getIndex(titleEnd)
        if (columnIndex === firstDefaultIndex) return [1, titleEndIndex - firstDefaultIndex]
        if (columnIndex >= titleEndIndex) return [1, 1]
        return [0, 0]
      }
      return columnIndex === firstDefaultIndex ? [1, this.getRestLength(firstDefaultIndex)] : [0, 0]
    }
  }
  createChildrenSpan = () => {
    let getSpan = (param) => {
      return this.mergeSpan(
        this.childrenRowspan(param),
        this.childrenColspan(param)
      )
    }
    if (this.option.isExpanded) {
      getSpan = (param) => {
        return this.mergeSpan(
          this.expandChildrenRowspan(param),
          this.childrenColspan(param)
        )
      }
    }
    if (!this.option.isTitle) {
      getSpan = (param) => {
        return this.mergeSpan(
          this.childrenRowspan(param)
        )
      }
    }
    return (param) => {
      if (param.row.$isTitle) return
      
      return getSpan(param)
    }
  }
  childrenRowspan = ({ row, column }) => {
    const parentProp = this.rowspanMap[column.property]
    if (this.option.spanProps.includes(column.property) || parentProp) {
      const children = this.getParentChildren(row, parentProp)
      const index = findIndex(children, row)
      if (index < 0) return
      return index === 0 ? { rowspan: children.length } : [0, 0]
    }
  }
  expandChildrenRowspan = (param) => {
    let result = this.childrenRowspan(param)
    // 展开/收起功能特殊处理：收起时，rowspan最大值限制为expandRow
    if (!this.getTop(param.row).$expanded) {
      result = this.mergeSpan(result)
      result[0] = Math.min(result[0], this.option.expandRow)
    }
    return result
  }
  childrenColspan = ({ columnIndex }) => {
    const firstDefaultIndex = this.getFirstDefaultIndex()
    if (columnIndex === firstDefaultIndex) return { colspan: firstDefaultIndex + 1 }
    if (columnIndex < firstDefaultIndex) return [0, 0]
  }
  
  mergeSpan = (...rest) => {
    let result = {}
    for (const span of rest) {
      if (!span) continue
      const handledSpan = this.handleSpan(span)
      merge(result, handledSpan)
    }
    return [result.rowspan ?? 1, result.colspan ?? 1]
  }
  handleSpan = (span) => {
    if (isArray(span)) return { rowspan: span[0], colspan: span[1] }
    return span
  }
  
  
  wrapHandleTableData = (wrappedFn) => {
    return (handler) => {
      return (data) => {
        const processedData = handler(data)
        wrappedFn(data, processedData)
        return processedData
      }
    }
  }
  treeTable = {
    mergeOption: {
      filterable: (data) => {
        return data.filter((row) => {
          return this.treeTable.rowClassName({ row }) !== 'none'
        })
      }
    },
    rowClassName: ({ row }) => {
      if (!row.$isTitle && !this.getTop(row).$expanded && row.$index > this.option.expandRow - 1) return 'none'
    },
    showExpandBtn: (row, isRowspan) => {
      const hasBtn = this.getParentChildren(row).length > this.option.expandRow
      if (!hasBtn) return false
      
      // 展开按钮列为rowspan（行合并）单元格
      // 展开/收起按钮显示：子项第一行
      if (isRowspan) return true
      
      // 按钮总是显示在可显示的最后一个子项：展开时显示所有子项的最后一个；收起时显示可显示的子项的最后一个
      // 可显示：例如有4个子项，expandRow为3表示收起时只显示3个子项，这三个子项就是可显示子项；展开时可显示子项为全部4个
      return this.getTop(row).$expanded ? row.$isLast : row.$index === this.option.expandRow - 1
    },
    expandClick: (row) => {
      // 解决isOnePage时，展开table不出现滚动条问题
      this.crud.$nextTick(() => {
        this.crud.getFilterData()
        setTimeout(() => this.crud.doLayout())
      })
      const parent = this.getTop(row)
      return parent.$expanded = !parent.$expanded
    },
    expandBtnTxt: (row) => {
      const str = this.getTop(row).$expanded ? this.option.expandOn : this.option.expandOff
      return str.replace('{length}', this.getParentChildren(row).length - this.option.expandRow)
    },
    wrappedHandleTableData: this.wrapHandleTableData(
      (data) => {
        for (const row of data) {
          row.$expanded = false
        }
      }
    ),
    
    selectable(row) {
      return row.$isTitle
    }
  }
  getTop = (row) => {
    return row.$top || {}
  }
  getParentChildren = (row, parentProp = 'parent') => {
    return flatMapDeep(
      get(row, `$${ parentProp }.$children`, []),
      (item) => {
        if (item.$isRow) {
          return item
        } else {
          return chain(item.$children)
            .flatMapDeep(child => this.getParentChildren(child))
            .uniq()
            .value()
        }
      }
    )
  }
  
  
  shortTermData = {}
  shortTerm(fn, name = fn.name) {
    return validValue(
      this.shortTermData[name],
      () => {
        setTimeout(() => {
          delete this.shortTermData[name]
        })
        return this.shortTermData[name] = fn()
      }
    )
  }
  
  
  static toArray(data = null) {
    return isArray(data) ? data : data ? [data] : []
  }
  static invoke(fn, ...args) {
    if (isFunction(fn)) return fn.apply(this, args)
  }
  static fillProps(target, source, props) {
    if (isArray(props)) props = props.map(prop => [].concat(prop))
    return Object.assign(target, FormatObject.format(source, props))
  }
}

export function validValue(value, fn) {
  if (value !== undefined) return value
  return fn()
}
