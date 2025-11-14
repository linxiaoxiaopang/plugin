export default function getBaseTableData(option) {
  const { dataAttrs, attrs, isCloneDeep } = option
  return {
    data() {
      return {
        ...dataAttrs,
        baseTable: null
      }
    },
    watch: {
      baseTable: {
        handler(baseTable) {
          if (!baseTable) return
          this.setPropFromBaseTable()
        },
        immediate: true
      }
    },
    methods: {
      setPropFromBaseTable() {
        let { baseTable } = this
        if (!baseTable) return
        return baseTable.setPropFromProxy({
          target: this,
          name: 'baseTable',
          attrs,
          dataAttrs,
          isCloneDeep
        })
      }
    }
  }
}
