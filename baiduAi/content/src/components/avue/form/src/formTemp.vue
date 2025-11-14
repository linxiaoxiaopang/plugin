<template>
  <component
    :is="componentName"
    v-model="form[column.prop]"
    :trim="column.trim"
    :column="column"
    :precision="column.precision"
    :label="column.label"
    :props="column.props"
    :placeholder="placeholder"
    :clearable="column.clearable"
    :type="column.type"
    :size="finalSize"
    :prefix-icon="column.prefixIcon"
    :minRows="column.minRows"
    :maxRows="column.maxRows"
    :maxlength="column.maxlength"
    :dic="dic"
    :disabled="disabled"
    :readonly="readonly"
    :format="column.format"
    :value-format="column.valueFormat"
    :emitPath="column.emitPath"
    :checkStrictly="column.checkStrictly"
    :show-all-levels="column.showAllLevels"
    :style="column.style"
    :expandTrigger="column.expandTrigger"
    :controls="column.controls"
    :controls-position="column.controlsPosition"
    v-bind="attrs"
    v-on="$listeners"
  ></component>
</template>

<script>
import { getComponent } from '../../utils/util'
import { upperFirst } from 'lodash'
import { getBindData, getPlaceholder } from '@/components/avue/core/dataformat'

export default {
  name: 'formTemp',
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    value: {},
    column: {
      type: Object,
      default: () => ({})
    },
    disabled: Boolean,
    readonly: Boolean,
    dic: Object | Array,
    size: String
  },
  computed: {
    finalSize() {
      return this.column.size || this.size
    },
    placeholder() {
      return getPlaceholder(this.column)
    },
    attrs() {
      return getBindData(this.column, 'dicData')
    },
    componentName() {
      return this.getComponent(this.column.type)
    }
  },
  methods: {
    getComponent(type) {
      return upperFirst(getComponent(type)).replace(/^(avue)?/i, 'avue')
    }
  }
}
</script>

<style lang="scss" scoped>

</style>