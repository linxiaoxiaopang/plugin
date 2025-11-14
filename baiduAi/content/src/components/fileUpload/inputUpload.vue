<template>
  <div class="input-upload-component">
    <avue-crud-input v-bind="all$Attrs" v-model="currentValue">
      <template slot="append">
        <FileUploadBtn ref="uploadBtn" :limit="limit" :files.sync="files" :isCoverFiles="isCoverFiles">
          <span>
            <i class="el-icon-upload icon-upload"></i>
            浏览
          </span>
        </FileUploadBtn>
      </template>
    </avue-crud-input>
    <div class="preview mt10" v-if="currentValue">
      <el-image fit="contain" class="preview-image" :src="currentValue"></el-image>
      <div class="preview-remove">
        <i class="el-icon-close" @click="onclose"></i>
      </div>
    </div>
  </div>
</template>

<script>
import FileUploadBtn from './fileUploadBtn'
import { validatenull } from '@/components/avue/utils/validate'
import { merge } from 'lodash'

const defaultOption = {
  placeholder: '在此次上传或粘贴网址'
}

export default {
  components: {
    FileUploadBtn
  },

  props: {
    value: {},

    dirPrefix: {
      type: String,
      default: $ossDirMapWithType.designBackground
    },

    isCoverFiles: {
      type: Boolean,
      default: true
    },

    limit: {
      type: Number,
      default: 1
    }
  },

  data() {
    return {
      files: []
    }
  },

  computed: {
    all$Attrs({ $attrs }) {
      const { form, ...rest$attrs } = $attrs
      return merge({}, defaultOption, rest$attrs)
    },

    currentValue: {
      get({ value }) {
        return value
      },

      set(newVal) {
        if (!newVal) this.files = []
        this.$emit('input', newVal)
      }
    }
  },

  watch: {
    files: {
      async handler() {
        await this.uploadToOss()
      },
      immediate: true
    }
  },

  methods: {
    async uploadToOss() {
      if (validatenull(this.files)) return
      const filterFiles = this.files.filter(item => !item._uploaded)
      if (!filterFiles.length) return
      const res = await $uploadOSSPics([
        {
          files: filterFiles,
          dirPrefix: this.dirPrefix,
          fileType: 'designBackground',
          prop: 'path'
        }
      ])
      if (!res) {
        this.currentValue = ''
        return
      }
      filterFiles.map(item => {
        item._uploaded = true
      })
      const ossHost = $GET($uploadOSSPics.ossInstance, 'ossUploadObj.host', '') + '/'
      this.currentValue = ossHost + res.path
    },

    onclose() {
      this.currentValue = ''

    }
  }
}

</script>

<style lang="scss" scoped>
.preview {
  position: relative;
}

.preview:before {
  display: block;
  content: "";
  width: 100%;
  padding-bottom: 50%;
  min-height: 40px;
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: 50%;
  background-color: $bg-color;
}

.preview-remove {
  position: absolute;
  top: 1px;
  right: 1px;
  z-index: 1;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  text-shadow: 1px 0 0 #fff;
  background: $color-danger;
}

.icon-upload {
  font-size: 20px;
  position: relative;
  top: 2px;
}

</style>
