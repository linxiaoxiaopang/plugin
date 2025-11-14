/* eslint-disable */
import { curryRight, merge } from 'lodash'
import { dicToCommon } from '@/components/base/baseTable/store/dic'

const DEFAULT_PROPS = {
  label: 'label',
  value: 'value',
  children: 'children'
}

export default {
  props: {
    props: {
      type: Object,
      default: () => DEFAULT_PROPS
    }
  },
  computed: {
    finalProps() {
      return merge({}, DEFAULT_PROPS, this.props)
    },
    dictLabel() {
      return this.finalProps.label
    },
    dictValue() {
      return this.finalProps.value
    },
    dictChildren() {
      return this.finalProps.children
    },
    
    normalizeDic() {
      return curryRight(dicToCommon)(this.finalProps)
    }
  }
}