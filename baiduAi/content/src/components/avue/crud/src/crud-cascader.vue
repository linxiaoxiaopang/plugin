<template>
  <el-cascader
    ref="cascader"
    :key="cascaderKey"
    v-model="text"
    :options="dic"
    :size="size"
    :placeholder="placeholder || '请选择'+placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :show-all-levels="showAllLevels"
    :props="cascaderProps"
    :collapse-tags="column.collapseTags"
    v-bind="$attrs"
    @change="handleCascaderChange"
  >
    <template v-for="(val, key) in $scopedSlots" v-slot:[key]="scope">
      <slot :name="key" v-bind="scope"></slot>
    </template>
  </el-cascader>
</template>

<script>
import propsMixin from '../../mixins/propsMixin'
export default {
  name: 'AvueCrudCascader',
  mixins: [propsMixin],
  props: {
    emitPath: {
      type: Boolean,
      default: false
    },
    checkStrictly: {
      type: Boolean,
      default: true
    },
    showAllLevels: {
      type: Boolean,
      default: false
    },
    expandTrigger: {
      type: String
    },
    column: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      cascaderKey: 0
    }
  },
  computed: {
    config() {
      return {
        options: this.dic
      }
    },
    cascaderProps({ props, expandTrigger, emitPath, checkStrictly, isRadio, column }) {
      let {
        multiple
      } = column
      if (!expandTrigger && isRadio) expandTrigger = 'hover'
      return {
        ...props,
        expandTrigger,
        emitPath,
        checkStrictly,
        multiple
      }
    },
    isRadio({ checkStrictly, column: { multiple } }) {
      return checkStrictly && !multiple
    }
  },
  watch: {
    config: {
      handler() {
        this.cascaderKey++
      },
      deep: true
    }
  },
  methods: {
    handleCascaderChange(val) {
      if (this.isRadio) this.$refs.cascader.dropDownVisible = false
      this.handleChange(val)
      // console.log(this.$refs.cascader.getCheckedNodes())
    }
  }
}
</script>

<style>

</style>
