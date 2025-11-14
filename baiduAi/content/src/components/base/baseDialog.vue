<template>
  <el-dialog
    v-el-drag-dialog
    class="dialog-component"
    :visible.sync="visible"
    :append-to-body="$attrs['append-to-body'] === undefined ? true : $attrs['append-to-body']"
    :width="$attrs.width || '75%'"
    :before-close="onCancel"
    :destroy-on-close="true"
    @open="openHandle"
    @close="closeHandle"
    @closed="closedHandle"
    v-bind="$attrs"
  >
    <template slot="title">
      <slot name="title" :visible="visible">
        <div class="el-dialog__title">{{ $attrs.title || '提示' }}</div>
      </slot>
    </template>
    <div
      class="dialog-body"
      :style="{
        'max-height': maxHeight,
        'min-height': minHeight,
        height,
        overflowY: 'auto',
        overflowX: 'hidden'
      }"
    >
      <slot>this is commonDialong slot</slot>
    </div>
    <span slot="footer" class="dialog-footer" v-if="!hiddenFooter">
      <slot name="footer">
        <!-- <el-button type="primary" @click="onSure">确定</el-button> -->
        <el-button @click="onCancel">取 消</el-button>
      </slot>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },
    //隐藏底部
    hiddenFooter: {
      type: Boolean,
      default: false
    },
    height: String,
    maxHeight: String,
    minHeight: String
  },
  data() {
    return {
      visible: this.dialogVisible
    }
  },
  watch: {
    visible(newVal) {
      this.$emit('update:dialogVisible', newVal)
    },
    dialogVisible(newVal) {
      this.visible = newVal
    }
  },
  methods: {
    openHandle() {
      this.$emit('openHandle')
    },
    closeHandle() {
      this.$emit('closeHandle')
    },
    closedHandle() {
      this.$emit('closed')
    },
    onSure() {
      this.$emit('onSure')
    },
    onCancel() {
      this.$emit('onCancel')
      this.visible = false
    }
  }
}
</script>
