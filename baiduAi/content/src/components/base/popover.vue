<template>
  <!-- popover跟随最近的可滚动的父级滚动而滚动：overflow: auto; -->
  <el-popover
    ref="popover"
    style="display: inline-block"
    popper-class="normal-popover"
    :class="{ 'is-disabled': disabled }"
    :placement="placement"
    :width="$attrs.width || 200"
    :title="$attrs.title"
    :disabled="disabled || loading"
    :append-to-body="appendToBody"
    v-model="visible"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot name="tip">
      <div v-if="type === 'warning'" class="mb20 pos-relative">
        <i class="el-icon-warning text-warning pos-absolute" style="top: 0"></i>
        <div class="text-mini" style="margin-left: 24px; font-size: 14px">
          {{ content }}
        </div>
      </div>
      <p v-else>{{ content }}</p>
    </slot>
    <div style="text-align: right; margin: 0" v-if="showBtn">
      <el-button size="mini" :type="cancelButtonType" @click="visible = false">取消</el-button>
      <el-button type="primary" size="mini" @click="sureHandler">确定</el-button>
    </div>
    <div slot="reference">
      <slot name="reference" :disabled="disabled" :popoverLoading="loading" :scope="loading">
        <baseButton v-if="type" type="text" :disabled="disabled" :loading="loading">删除</baseButton>
        <el-button v-else>删除</el-button>
      </slot>
    </div>
  </el-popover>
</template>

<script>
import { getParentByClassName } from '@/utils/vue'

export default {
  props: {
    type: String,
    disabled: Boolean,
    placement: {
      type: String,
      default: 'top'
    },
    cancelButtonType: {
      type: String,
      default: 'text'
    },
    appendToBody: {
      type: Boolean,
      default: true
    },
    showBtn: {
      type: Boolean,
      default: true
    },
    content: {
      type: String,
      default: '确定删除吗,如果存在下级节点则节点上升，此操作不能撤销！'
    }
  },
  data() {
    return {
      visible: false,
      loading: false
    }
  },
  mounted() {
    let fixedWrapper = getParentByClassName('el-table__fixed-right', this)
    if (fixedWrapper) {
      let bodyWrapper = fixedWrapper.parentNode.getElementsByClassName('el-table__body-wrapper')[0]
      bodyWrapper.removeEventListener('scroll', this.$refs.popover.updatePopper)
      bodyWrapper.addEventListener('scroll', this.$refs.popover.updatePopper)
    }
  },
  methods: {
    async sureHandler() {
      if (this.loading) return
      this.loading = true
      try {
        await this.$listeners.sureHandler.fns(this)
      } catch (err) {
        console.log(err)
      }
      this.loading = false
      this.doClose()
    },
    doClose() {
      this.visible = false
      let { popover } = this.$refs
      if (popover) popover.doClose()
    }
  }
}
</script>

<style lang="scss">
.normal-popover {
  padding: 12px;
}
</style>