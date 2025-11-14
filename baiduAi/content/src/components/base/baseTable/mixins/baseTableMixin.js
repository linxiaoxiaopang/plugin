/* eslint-disable */
import { getColumnLenByOption } from '@/components/base/baseTable/utils/util'
import { validatenull, validatePipe } from '@/components/avue/utils/validate'
import { upperFirst, map } from 'lodash'
import getBaseTableDataMixin from '@/components/base/baseTable/mixins/getBaseTableDataMixin'
import { getResult } from '@/utils/functional'
import { validData } from '@/components/avue/utils/util'

export default function (option = {}) {
  return {
    mixins: [
      getBaseTableDataMixin({
        ...option,
        dataAttrs: {
          curTabItem: {},
          ...option.dataAttrs
        }
      })
    ],
    data() {
      option.needThis !== false && (this.sup_this = this)
      return {
        selectionData: [],
        selectionCount: 0,
        checkAllLoading: false
      }
    },
    computed: {
      columnLen() {
        return getColumnLenByOption(this.baseTable?.finalOption)
      },
      permission() {
        return this.curTabItem?.childPermission || {}
      },
    
      selectionIdList({ selectionData }) {
        return map(selectionData, 'id')
      }
    },
    methods: {
      selectionChange(selectionData) {
        this.selectionData = selectionData
      },
      selectionCountChange(selectionCount) {
        this.selectionCount = selectionCount
      },
      async getSelectionData() {
        let selectionData = await this.baseTable?.getSelectionData()
        if (selectionData) {
          return this.selectionData = selectionData
        }
      },
      getAllDataLoading(loading) {
        this.checkAllLoading = loading
      },
      getPermission(key, ...args) {
        if (!this.permission[key]) return false
    
        const { permissions } = this
        if (!permissions) return true
    
        return getResult(validData(permissions[key], true), ...args, {})
      },
      
      handleTabChange() {},
      init() {
        return this.baseTable?.init()
      },
      emptyInit() {
        return this.baseTable?.emptyInit()
      },
      searchChange() {
        return this.baseTable?.searchChange()
      },
  
      validatePipe
    }
  }
}

// 将混入的方法与组件方法合并
export function mixinMethodsMergeIntoComponent(fns) {
  if (validatenull(fns)) return
  if (Array.isArray(fns)) {
    let tempObj = {}
    fns.forEach(fn => {
      tempObj[fn.name] = fn
    })
    fns = tempObj
  } else if (typeof fns === 'function') {
    fns = {
      [fns.name]: fns
    }
  }
  for (const fnName in fns) {
    let fn = fns[fnName]
    if (this[fnName] && !this[fnName].isRewrite) {
      let FnName = upperFirst(fnName)
      let mixinFnName = `mixin${FnName}`
      let componentFnName = `component${FnName}`
      
      this[mixinFnName] = fn.bind(this)
      this[componentFnName] = this[fnName]
      this.handleTabChange = (value) => {
        typeof this[mixinFnName] === 'function' && this[mixinFnName](value)
        typeof this[componentFnName] === 'function' && this[componentFnName](value)
      }
      this[fnName].isRewrite = true
    } else if (!this[fnName]) {
      this[fnName] = fn.bind(this)
    }
  }
}