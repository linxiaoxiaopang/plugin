<template>
  <baseTable
    ref="baseTable"
    :sup_this="sup_this"
    v-bind="$attrs"
    v-on="$listeners"
    @selection-change="selectionChange"
  >
    <template v-for="(item, name) in $scopedSlots" #[name]="scoped">
      <slot :name="name" v-bind="scoped"></slot>
    </template>
  </baseTable>
</template>

<script>
import baseTableMixin from '@/components/base/baseTable/mixins/baseTableMixin'

export default {
  mixins: [
    baseTableMixin({
      dataAttrs: {
        elTableInstance: null
      }
    })
  ],

  data() {
    return {
      sup_this: this
    }
  },

  methods: {
    selectionChange(selection) {
      this.$emit('toggleSelectionData', selection)
    },
    toggleRowSelection(...args) {
      this.$refs.baseTable.toggleSelection(...args)
    },
    clearSelection() {
      this.$refs.baseTable.clearSelection()
    }
  }
}

</script>

<style lang="scss" scoped>

</style>
