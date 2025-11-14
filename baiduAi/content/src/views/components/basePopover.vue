<template>
  <!-- popover跟随最近的可滚动的父级滚动而滚动：overflow: auto; -->
  <el-popover
    ref="popover"
    @show="onShow"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template v-if="isOpened">
      <slot></slot>
    </template>
    <template slot="reference"><slot name="reference"></slot></template>
  </el-popover>
</template>

<script>
import { componentMethodsMixin } from '@/mixins'

export default {
  mixins: [
    componentMethodsMixin('popover', ['doToggle', 'doShow', 'doClose', 'updatePopper'])
  ],
  props: {
    // 打开popover后，初始化default插槽内容
    initOnOpen: {
      type: Boolean,
      default: true
    },

    beforeOpen: Function
  },
  data() {
    return {
      // 是否打开过popover
      isOpened: false
    }
  },

  methods: {
    async onShow() {
      if(!this.beforeOpen) {
        return this.isOpened = true
      }
      const res = await this.beforeOpen()
      if(!res) return 
      this.isOpened = true
      await this.$nextTick()
      this.updatePopper()
    }
  }
}
</script>

<style lang="scss"></style>