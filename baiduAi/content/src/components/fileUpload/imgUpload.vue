<template>
  <div class="imgUpLoadComponent" :class="{ [`type--${ type }`]: type }">
    <draggable :list="temFilesList" v-bind="dragOption" class="list" @change="dragChange">
      <template v-if="validData(option.showImageList, true)">
        <div
          v-for="(file, indx) in temFilesList || []"
          v-loading="loading"
          :class="['item', file.uploadStatus === 'success' && 'success-item']"
          :style="{
            width: finalSize,
            height: finalSize,
            'line-height': finalSize
          }"
          :key="file.uid || file.id"
        >
          <div class="card-wrapper">
            <div class="pic-name" v-if="showFileName">
              {{ fileName(file) }}
            </div>
            <label
              v-if="file.uploadStatus"
              :class="['el-upload-list__item-status-label', file.uploadStatus === 'fail' && 'error']"
            >
              <i class="el-icon-upload-success el-icon-check" v-if="file.uploadStatus === 'success'"></i>
              <i class="el-icon-upload-success el-icon-warning-outline" v-else-if="file.uploadStatus === 'fail'"> </i>
            </label>

            <img
              ref="img"
              style="object-fit: contain"
              :style="{
                width: finalSize,
                height: finalSize
              }"
              @load="loadedHandler(indx, file)"
              @error="onerror(file)"
              :src="srcList[file.$srcKey]"
            />

            <div class="dialog" v-if="!hideDialog">
              <slot name="dialogIcon" :file="file" :index="indx"></slot>
              <i class="el-icon-delete" @click="deleteHandler(file, indx)"></i>
            </div>
          </div>
        </div>
      </template>
      <uploadBtnWrapper
        v-if="showUploadBtn"
        class="upload-item"
        :style="referenceStyle"
        v-model="popoverCascaderPanelValue"
        :disabled="disabled"
        :dic="popoverDic"
        @change="selectHandler"
      >
        <el-upload
          ref="upload"
          slot="reference"
          :disabled="uploadDisabled"
          :http-request="requestHandler"
          :file-list="files"
          :show-file-list="false"
          :action="$attrs.action || '#'"
          :list-type="$attrs['list-type'] || 'picture-card'"
          :accept="accept"
          style="width: 100%; height: 100%"
          :before-upload="$attrs['before-upload'] || beforeUpload"
          :multiple="$attrs.multiple === undefined ? false : $attrs.multiple"
          v-bind="$attrs"
          v-on="$listeners"
        >
          <color-text-btn v-if="option.uploadBtn" slot="default">批量上传</color-text-btn>
          <i v-else slot="default" class="el-icon-plus"></i>
          <template #tip>
            <slot name="tip" />
          </template>
        </el-upload>

        <template v-for="(val, key) in $scopedSlots" v-slot:[key]="scope">
          <slot :name="key" v-bind="scope"></slot>
        </template>
      </uploadBtnWrapper>
    </draggable>
  </div>
</template>
<script>
import popoverCascaderPanel from '@/components/popoverCascaderPanel'
import emitter from 'element-ui/src/mixins/emitter'
const SIZE = 200 //图片大小限制
import config from '@/service/config'
const serverRootPath = config.baseURL
import { getThumbnail, getPicName, getFileSuffix, parseImgSrc } from '@/utils'
//图片上传到oss的uuid和原本文件名称的分隔符
import { OSS_SEPARATOR } from '@/utils/constant'

import draggable from 'vuedraggable'
import { setPx, validData } from '@/components/avue/utils/util'
// draggable 配置：https://segmentfault.com/a/1190000021376720
import { set, get, defaults, findLastIndex } from 'lodash'
import { isNumber } from '@/components/avue/utils/validate'
import { wrappedListener } from '@/utils/vue'

const dragMap = new Map()

export default {
  components: {
    draggable,
    uploadBtnWrapper: {
      functional: true,
      render(h, { props: { dic }, scopedSlots, data }) {
        if (dic) {
          const nativeClick = get(data, 'native.click', () => {})
          set(data, 'native.click', wrappedListener(nativeClick, ['prevent', 'stop']))
          return h(
            popoverCascaderPanel,
            data
          )
        }
        return (
          <div { ...data }>
            { scopedSlots.reference() }
          </div>
        )
      }
    }
  },
  mixins: [emitter],
  props: {
    // uploadBtn
    type: {},
    accept: {
      type: String,
      default: 'image/jpeg,image/png,image/jpg'
    },
    showFileName: {
      type: Boolean,
      default: true
    },
    files: {
      default: () => []
    },
    title: String, //更改为前端上传图片后，图片名称都为随机字符串，传入title显示真实的图片名称
    loading: {
      type: Boolean,
      default: false
    },

    //获取属性
    prop: {
      type: String
    },

    //是否需要获取图片的尺寸
    needPicSIze: {
      type: Boolean,
      default: false
    },
    size: {},

    hideDialog: Boolean,
    hiddenUploadBtn: Boolean,
    validateEvent: Boolean,
    disabled: Boolean,
    isCompressFile: {
      type: Boolean,
      default: true
    },

    popoverDic: Array
  },
  data() {
    return {
      temFilesList: [],
      srcList: {},

      popoverCascaderPanelValue: ''
    }
  },
  watch: {
    files: [{
      handler(newVal) {
        if (!Array.isArray(newVal)) return this.$emit('update:files', [])
        // console.log(newVal.map(({ uid }) => uid), newVal, this.srcList)
        this.temFilesList = newVal
        let nSrcList = {}
        newVal.map((file) => {
          let url = file.url || file.path
          let srcKey = file.uid || file.id
          file.$srcKey = srcKey
          if (url) {
            if (!/^http/.test(url)) {
              nSrcList[srcKey] = url
            }
            return (nSrcList[srcKey] = url)
          }
          // 需要获取图片宽高时，不压缩图片
          if (this.isCompressFile && !this.needPicSIze) {
            getThumbnail(file).then((res) => {
              file.__thumbnailPath = res.url
              this.$set(nSrcList, srcKey, file.url = res.url)
            })
          } else if (file.type.indexOf('image/') === 0) {
            this.$set(nSrcList, srcKey, file.url = file.__thumbnailPath = URL.createObjectURL(file))
          }
        })
        // console.log(nSrcList)
        this.srcList = nSrcList
      },
      deep: true,
      immediate: true
    }, function(newVal) {
      if (!this.validateEvent) return
      this.dispatch('ElFormItem', 'el.form.change', [newVal])
    }]
  },
  filters: {
    //格式化图片地址
    formatRowUrl(file) {
      let url = file.url || file.path
      if (url) {
        if (!/^http/.test(url)) {
          return `${serverRootPath}${url}`
        }
        return url
      }
      return URL.createObjectURL(file)
    }
  },
  computed: {
    showUploadBtn() {
      if (this.hiddenUploadBtn) {
        return false
      }
      if (!this.$attrs.limit) {
        return true
      }
      return this.$attrs.limit > this.files.length
    },
    fileName() {
      return (file) => {
        //存在title 返回title，title的权重高于file.name
        if (this.title) {
          return this.title
        }
        if (file.name || file.title) {
          return file.name || file.title
        }
        const url = file.path || file.url
        if (!url.includes('.')) return url
        if (url) {
          let fileName
          try {
            fileName = getPicName(decodeURIComponent(file.url || file.path || ''))
          } catch (e) {}
          try {
            const suffix = getFileSuffix(file.url || file.path || '')
            return fileName.split(OSS_SEPARATOR)[0].replace(`.${suffix}`, '') + `.${suffix}`
          } catch (err) {
            return fileName
          }
        }
        return '暂无名称'
      }
    },
    dragOption() {
      return {
        animation: 200,
        group: 'description',
        ghostClass: 'ghost',
        draggable: '.item',
        disabled: this.$attrs.dragDisabled,
        ...this.$attrs
      }
    },

    finalSize() {
      return setPx(this.size, 148)
    },
    referenceStyle({ finalSize }) {
      if (this.option.uploadBtn) return
      return {
        width: finalSize,
        height: finalSize,
        'line-height': finalSize
      }
    },

    option() {
      const defaultOption = {
        popoverCascaderPanel: () => {
          this.$nextTick(() => {
            this.popoverCascaderPanelValue = null
          })
        }
      }
      const options = {
        default: defaultOption,
        uploadBtn: {
          ...defaultOption,
          size: 'auto',
          uploadBtn: true,
          showImageList: false
        }
      }
      return options[this.type] || options.default
    },
    uploadDisabled() {
      if (this.disabled) return true
      if (this.popoverCascaderPanelValue) return false
      return !!this.popoverDic
    }
  },
  beforeDestroy() {
    // 解决组件隐藏再显示之后，图片加载失败问题：getThumbnail获取到的路径失效
    const { files } = this
    for (const file of files) {
      if (file.url === file.__thumbnailPath) {
        delete file.url
        delete file.__thumbnailPath
      }
    }
  },
  methods: {
    validData,
    loadedHandler(index, file) {
      const src = this.srcList[file.$srcKey]
      // console.log('src', src)
      const img = new Image()
      img.onload = () => {
        if (this.needPicSIze) {
          const { width, height } = img
          this.files[index].width = width
          this.files[index].height = height
          this.files[index].prop = this.prop

          // 给File对象设置响应式不会触发响应式更新？
          // 触发响应式
          this.files.splice(index, 1, file)
        }
      }
      img.src = src
    },
    //检查图片类型和尺寸
    beforeUpload(file) {
      let typeArr = this.accept
      if (typeof typeArr === 'string') {
        typeArr = typeArr.split(/[,，]\s*/)
      }
      console.log('file', file.type)
      const includeType = typeArr.includes(file.type)
      const size = this.$attrs.picSize || SIZE
      const isMoreSize = file.size / 1024 / 1024 < size
      if (!includeType) {
        this.$message.error(`上传图片只能是 ${typeArr.join(',')} 格式!（请确保后缀是小写）`)
      }
      if (!isMoreSize) {
        this.$message.error(`上传图片大小不能超过 ${size}MB!`)
      }
      return includeType && isMoreSize
    },
    picLoadHandler(file) {
      URL.revokeObjectURL(file.url)
    },
    //上传成功状态 'success', 失败状态'fail'
    toggleUploadStatus(status) {
      this.temFilesList.map((item) => (item.uploadStatus = status))
      this.$emit('update:files', this.temFilesList)
    },
    //删除单个接口
    deleteHandler(file, index) {
      if (!file.uploadStatus) {
        this.temFilesList.splice(index, 1)
        this.$emit('update:files', this.temFilesList)
      }
      this.$emit('deleteUploadImgHandler', {
        file,
        index
      })
    },
    //自定义上传
    requestHandler(info) {
      const { action, file } = info
      this.temFilesList.push(file)
      this.timer && clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.$emit('update:files', this.temFilesList)
        this.$emit('updateFiles', this.temFilesList)
      }, 100)
    },

    dragChange(e) {
      this.$emit('dragChange', e)
      this.$emit('update:files', this.temFilesList)

      this.globalDragChange(e)
    },
    // 全局拖拽图片：该组件在页面上渲染了多个DOM时，可互相拖拽。拖拽时，如果添加方超过了上传图片个数，则将添加方最后一张图（除被拖拽图片）转移至移除方（交换图片）
    globalDragChange(e) {
      const { added, removed } = e
      // 无需判断当前组件是添加方还是移除方
      // defaults只会将值为undefined的属性替换掉
      const current = added || removed
      if (!current) return

      current.files = this.temFilesList
      const { element } = current
      // 存在全局dragMap
      let map = dragMap.get(element)
      if (!map) dragMap.set(element, map = {})
      defaults(map, { added, removed })

      if (map.timer) clearTimeout(map.timer)
      map.timer = setTimeout(() => {
        const { added, removed } = map
        if (added && removed) {
          const { limit } = this.$attrs
          // 如果添加方超过了上传图片个数，则将添加方最后一张图（除被拖拽图片）转移至移除方（交换图片）
          if (isNumber(limit) && added.files.length > limit) {
            const fileIndex = findLastIndex(added.files, item => item !== element)
            if (fileIndex >= 0) {
              const file = added.files.splice(fileIndex, 1)[0]
              file && removed.files.splice(removed.oldIndex, 0, file)
            }
          }
        }

        dragMap.delete(element)
        console.log(map)
      })
    },

    onerror(file) {
      if (!file.$url) {
        let url = parseImgSrc(this.srcList[file.$srcKey])
        this.srcList[file.$srcKey] = file.$url = file.url = url
      }
      console.log(file)
    },

    selectHandler(value) {
      this.$emit('popover-change', value)
      switch (value) {
        case 'local':
          // 先等uploadDisabled解开elUpload的上传限制，再调用handleClick方法上传图片
          this.$nextTick(() => this.$refs.upload?.$refs['upload-inner']?.handleClick())
          break
      }
      this.option.popoverCascaderPanel?.(value)
    }
  }
}
</script>
<style lang="scss" scoped>
.imgUpLoadComponent {
  .list {
    display: flex;
    flex-wrap: wrap;
    .item,
    .upload-item {
      margin-right: 10px;
      margin-bottom: 10px;
      border: 1px solid $border-color;
      border-radius: 4px;
      .card-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        .el-upload-list__item-status-label {
          display: block;
          position: absolute;
          right: -17px;
          top: -7px;
          width: 46px;
          height: 26px;
          background: #13ce66;
          text-align: center;
          transform: rotate(45deg);
          box-shadow: 0 1px 1px #ccc;
          line-height: 40px;
          z-index: 10;
          i {
            font-size: 12px;
            margin-top: 12px;
            transform: rotate(-45deg);
            font-weight: 600;
          }
          .el-icon-check,
          .el-icon-warning-outline {
            display: inline-block;
            width: 20px;
            text-align: right;
            color: #fff;
          }
        }
        .error {
          background: $color-danger;
        }
        .dialog {
          display: none;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.5);
          i {
            font-size: 30px;
            color: #fff;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      }
      .pic-name {
        position: absolute;
        height: 1rem;
        width: 100%;
        line-height: 1rem;
        z-index: 100;
        left: 0;
        bottom: 0;
        font-size: 12px;
        background: $color-primary;
        color: #fff;
        text-align: center;
        @include overflow;
        border-radius: 4px 4px 0 0;
      }
      .card-wrapper:hover {
        .dialog {
          display: block !important;
        }
        .success-dialog {
          display: none !important;
        }
      }
      ::v-deep {
        .el-loading-spinner {
          line-height: 1;
        }
        .el-upload {
          width: 100%;
          height: 100%;
          line-height: inherit;
          .el-icon-plus {
            line-height: inherit;
          }
        }
      }

      .el-upload.el-upload,
      .el-image {
        width: 100%;
        height: 100%;
      }
    }
    .upload-item {
      border: none;
    }
    //上传成功，隐藏上传按钮
    .success-item + .upload-item {
      display: none;
    }
  }

  &.type--uploadBtn {
    &::v-deep {
      .el-upload--picture-card {
        border: none;
        background-color: transparent;
      }
    }
  }
}
</style>
