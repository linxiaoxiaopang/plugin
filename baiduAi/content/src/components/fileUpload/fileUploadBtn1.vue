<template>
  <el-upload
    ref="elUpload"
    v-bind="all$Attrs"
    v-on="$listeners"
  >
    <slot>
      <i slot="default" class="el-icon-plus"></i>
    </slot>
    <template #tip>
      <slot name="tip"/>
    </template>
  </el-upload>
</template>

<script>
import uploadMixin from './mixins/uploadMixin'

export default {
  name: 'crudFileUploadBtn',
  mixins: [uploadMixin('btn')],

  props: {
    isFolder: {
      type: Boolean,
      default: false
    }
  },

  mounted() {
    this.toggleFolderMode()
  },

  methods: {
    toggleFolderMode() {
      if (!this.isFolder) return
      this.$refs.elUpload.$refs['upload-inner'].$refs.input.webkitdirectory = true
    }
  }
}
</script>
