<template>
  <basePopover
    ref="popover"
    popperClass="popover-cascader-panel"
    :placement="placement"
    trigger="hover"
    v-bind="$attrs"
  >
    <template #reference>
      <slot name="reference">
        <div class="inline-block">
          <ImgUpload
            :limit="1"
            :files="files"
            :size="size"
            disabled
            @deleteUploadImgHandler="deleteUploadImgHandler"
          />
        </div>
      </slot>
    </template>
    <el-cascader-panel
      class="display-picture-manage-custom-el-cascader-panel-wrapper"
      v-model="text"
      :options="dic"
      :props="config"
      @change="changeHandler"
    >
      <template #default="{ node, data }">
        <base-image v-if="validData(data.isImage, isImage)" :src="node.label" size="80" imgSize="none" fit="contain" class="node-image" />
        <template v-else>{{ node.label }}</template>
      </template>
    </el-cascader-panel>
  </basePopover>
</template>

<script>
import basePopover from '@/views/components/basePopover'
import ImgUpload from '@/components/fileUpload/imgUpload'
import merge from 'element-ui/src/utils/merge'
import { validData } from '@/components/avue/utils/util'
import { find, isArray } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

const defaultProps = {
  label: 'label',
  value: 'value'
}

export default {
  components: { basePopover, ImgUpload },
  props: {
    value: {},
    dic: {
      type: Array,
      default: () => ([])
    },
    placement: {
      type: String,
      default: 'right-start'
    },
    showAllLevels: Boolean,
    isImage: {
      type: Boolean,
      default: true
    },
    props: {
      type: Object,
      default: () => ({})
    },

    size: {}
  },
  data() {
    return {
      text: ''
    }
  },
  computed: {
    files({ text }) {
      if (validatenull(text)) return []
      const { dic, config } = this
      const files = isArray(text) ? text.map(findFile) : [findFile(text)]
      return files.filter(Boolean)

      function findFile(value) {
        const item = find(dic, { [config.value]: value })
        if (!item) return { url: value }
        return { url: item[config.label] }
      }
    },
    config() {
      return merge({ expandTrigger: 'hover' }, defaultProps, this.props || {})
    }
  },
  watch: {
    value: {
      handler(n) {
        this.text = this.findFile(n) || n
      },
      immediate: true
    },
    files(files) {
      this.$emit('update:files', files)
    }
  },
  methods: {
    changeHandler(pathValue) {
      const value = this.showAllLevels ? pathValue : pathValue[pathValue.length - 1]
      this.$emit('input', value)
      this.$emit('change', value)
      this.$refs.popover?.doClose()
    },
    deleteUploadImgHandler() {
      this.text = ''
      this.$emit('input')
      this.$emit('change')
    },

    findFile(value) {
      const { dic, config } = this
      return (find(dic, { [config.value]: value }) || find(dic, { [config.label]: value }))?.[config.value]
    },

    validData
  }
}
</script>

<style lang="scss" scoped>
.node-image {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0
}
</style>
<style lang="scss">
.popover-cascader-panel {
  padding: 0;
  &.el-popper {
    margin: 0;
  }
  .popper__arrow {
    display: none;
  }
}

.display-picture-manage-custom-el-cascader-panel-wrapper {
  .el-cascader-node {
    height: 80px;
    margin-bottom: 5px;
  }
  .el-cascader-node__label {
    height: 80px;
  }
}
</style>
