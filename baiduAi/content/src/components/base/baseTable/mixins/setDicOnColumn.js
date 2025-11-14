/* eslint-disable */
import getBaseTableDataMixin from '@/components/base/baseTable/mixins/getBaseTableDataMixin'
import { setDicOnColumn } from '@/components/base/baseTable/utils/dic'
import { validateDiffData } from '@/components/avue/utils/util'

export default {
  mixins: [
    getBaseTableDataMixin({
      dataAttrs: {
        postData: {},
        finalOption: {}
      }
    })
  ],
  computed: {
    searchColumn() {
      return this.finalOption.column?.filter(column => column.search)
    },
    setDicOption() {
      return {}
    }
  },
  watch: {
    postData: {
      handler(n, o) {
        if (validateDiffData(n, o, ['page'])) {
          this.setDicOnColumn()
        }
      },
      immediate: true
    },
    searchColumn: 'setDicOnColumn'
  },
  methods: {
    setDicOnColumn() {
      let { searchColumn, postData } = this
      setDicOnColumn(searchColumn, this.setDicOption, postData)
    }
  }
}