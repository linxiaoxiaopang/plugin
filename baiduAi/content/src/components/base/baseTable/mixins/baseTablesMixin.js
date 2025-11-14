/* eslint-disable */
import baseTableMixin from '@/components/base/baseTable/mixins/baseTableMixin'
import { validData } from '@/components/avue/utils/util'
import getParentAttrsMixin from '@/components/base/baseTable/mixins/getParentAttrs'
import proxyMixin from '@/components/base/baseTable/mixins/proxyMixin'

export default function (option = {}) {
  const { options, listOptions, baseTableOptions, DIC, permissions, status } = option
  return {
    mixins: [
      getParentAttrsMixin,
      baseTableMixin({ ...option, needThis: false }),
      proxyMixin([
        {
          name: 'basePage',
          relation: 'parent',
          attrs: [
            'init',
            'searchChange',
            'getSelectionData',
            'clearSelection',
            'getPermission',
            'permission',
            
            'selectionCount',
            'selectionData',
            'selectionIdList',
            
            'curTabItem',
            'curTabValue'
          ]
        },
        {
          name: 'basePage',
          relation: 'parent',
          attrs: {
            curDic: 'dic',
            params: 'postData'
          }
        }
      ])
    ],
    computed: {
      baseTableProps({ listOptions, baseTableOptions }) {
        return {
          list: listOptions[this.curType] || listOptions.default,
          option: baseTableOptions[this.curTabValue] || baseTableOptions.default
        }
      },
      dic({ DIC }) {
        return {
          ...this.getParentAttrs('dic'),
          ...DIC.default,
          ...DIC[this.curTabValue]
        }
      },
      tabOptions() {
        return this.options
      },
  
      options() {
        return this.getParentAttrs('options') || options
      },
      listOptions() {
        return this.getParentAttrs('listOptions') || listOptions
      },
      baseTableOptions() {
        return this.getParentAttrs('baseTableOptions') || baseTableOptions
      },
      DIC() {
        return this.getParentAttrs('DIC') || DIC
      },
      permissions() {
        return this.getParentAttrs('permissions') || permissions
      },
      status() {
        return this.getParentAttrs('status') || status || this.options
      },
      
      resetMergeData() {
        return this.getParentAttrs('resetMergeData')
      },
      handleSearchFormProps() {
        return this.getParentAttrs('handleSearchFormProps')
      },
      handlePostData() {
        return this.getParentAttrs('handlePostData')
      },
      
      curType() {
        return this.type || getType(this.$route)
      },
      curTabValue() {
        return validData(this.curTabItem.value, this.curType)
      }
    },
    methods: {
      selectionChange(selection) {
        this.selectionData = selection
      }
    }
  }
}

export function getType(route) {
  return route.path.split('/').pop()
}