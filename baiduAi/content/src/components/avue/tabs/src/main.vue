<template>
  <div :class="b()">
    <el-tabs
      v-model="active"
      :tab-position="parentOption.position"
      :type="parentOption.type"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        v-for="(column,index) in columnOption"
        :key="index"
        :name="index + ''"
        :disabled="column.disabled"
      >
        <span slot="label">
          <template v-if="column.icon">
            <i :class="column.icon"></i>&nbsp;
          </template>
          {{ column.label }}
        </span>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import create from '@/components/avue/core/create'

export default create({
  name: 'tabs',
  props: {
    option: {
      type: Object,
      required: true,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      active: '0'
    }
  },
  watch: {
    active() {
      this.$emit('change', this.tabsObj)
    }
  },
  computed: {
    tabsObj() {
      return this.columnOption[this.active]
    },
    parentOption() {
      return this.option

    },
    columnOption() {
      return this.parentOption.column || []
    }
  },
  methods: {
    changeTabs(active) {
      this.active = active + ''
    }
  }
})
</script>


