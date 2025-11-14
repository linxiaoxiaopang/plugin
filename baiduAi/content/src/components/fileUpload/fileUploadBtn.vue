<template>
  <el-upload
    ref="elUpload"
    :http-request="requestHandler"
    :show-file-list="false"
    :action="$attrs.action || '#'"
    :list-type="$attrs['list-type'] || 'text'"
    :before-upload="$attrs['before-upload'] || beforeUpload"
    :multiple="$attrs.multiple === undefined ? true : false"
    v-bind="$attrs"
    v-on="$listeners"
    v-upload
  >
    <slot>
      <i slot="default" class="el-icon-plus"></i>
    </slot>
    <template #tip>
      <slot name="tip" />
    </template>
  </el-upload>
</template>

<script>
import commonPrivateMixin from "./mixins/commonPrivateMixin"
export default {
  name: 'crudFileUpload',
  mixins: [commonPrivateMixin],
  props: {
    isCoverFiles: Boolean
  },
  directives: {
    upload: {
      inserted(el, binging, vNode) {
        const context = vNode.context
        const elUploadRef = $GET(context, '$refs.elUpload', null)
        const uploadInnerRef = $GET(elUploadRef, '$refs.upload-inner', null)
        const originFn = uploadInnerRef.handleChange
        const { isCoverFiles } = context
        if (!isCoverFiles) return
        uploadInnerRef.handleChange = (...args) => {
          elUploadRef.clearFiles()
          context.$nextTick(() => {
            originFn.call(uploadInnerRef, ...args)
          })
        }
      }
    }
  }
}
</script>
