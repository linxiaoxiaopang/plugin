import FileList from '../module/fileList'

import { assignProps, getFileName, file2Uint8Array, getImageType } from '@/utils'
import { replaceErrorMsg } from '@/utils/utils/classUtils/msgClass'
import { setPx, validData } from '@/components/avue/utils/util'
import { isArray, orderBy, last } from 'lodash'
import { OSS_SEPARATOR } from '@/utils/constant'

const FILE_MAX_SIZE = 200

const BASE_CONST = {
  showFileList: false,
  action: '#',
  listType: 'picture-card',
  multiple: true,
  size: 'medium',
  hideDialog: true,
  fileMaxSize: FILE_MAX_SIZE
}

const DEFAULT_CONST = {
  picture: {
    ...BASE_CONST,
    accept: 'image/jpeg,image/png,image/jpg',
    msg: {
      typeErr: '上传图片只能是$1格式!（请确保后缀是小写）',
      sizeErr: '上传图片大小不能超过$1MB!',
      suffixErr: '$1图片后缀异常，$2被修改为$3',
      fileTypeEmptySuffixErr: '上传图片异常，只能是 $1格式!',
      imageInfoEmptyErr: '非$1的图片的后缀'
    }
  },

  file: {
    ...BASE_CONST,
    msg: {
      typeErr: '上传文件只能是$1格式!（请确保后缀是小写）',
      sizeErr: '上传文件大小不能超过$1MB!',
      suffixErr: '$1文件后缀异常，$2被修改为$3',
      fileTypeEmptySuffixErr: '上传文件异常，只能是 $1格式!',
      imageInfoEmptyErr: '非$1的文件的后缀'
    }
  }
}

DEFAULT_CONST.btn = { ...DEFAULT_CONST.file, listType: 'text' }

const SIZE_TYPE_LIST = {
  mini: 60,
  small: 85,
  medium: 140,
  large: 200
}

export default function uploadMixin(uploadType = 'file') {
  return {
    components: {
      FileList
    },

    props: {
      title: String, //显示真实文件名，优先级最高

      files: {
        type: Array,
        default: () => []
      },

      showFileName: {
        type: Boolean,
        default: true
      },

      loading: {
        type: Boolean,
        default: false
      },

      beforeUploadFunc: {
        type: Function
      },

      showUploadFiles: {
        default: true
      },

      alwaysShowUploadBtn: Boolean,

      hiddenUploadBtn: Boolean,

      hideDialog: Boolean,

      picName: String,

      isOpenAnalysisImageType: Boolean //是否开启编码校验图片类型
    },

    data() {
      return {
        temFilesList: []
      }
    },

    watch: {
      files: {
        handler(newVal) {
          if (!isArray(newVal)) return this.$emit('update:files', [])
          this.temFilesList = newVal
        },
        deep: true
      }
    },

    computed: {
      showUploadBtn({ alwaysShowUploadBtn, hiddenUploadBtn, all$Attrs, temFilesList }) {
        const { limit } = all$Attrs
        if (hiddenUploadBtn) return false
        if (alwaysShowUploadBtn) return alwaysShowUploadBtn
        if (!limit) return true
        return limit > temFilesList.length
      },

      fileName({ title }) {
        return (file) => {
          let { name = '', path, url } = file
          url = validData(path, url)
          //存在title 返回title，title的权重高于file.name
          if (title) return title
          if (name) return name.split(OSS_SEPARATOR).shift()
          if (!url) return '暂无名称'
          return getFileName(url)
        }
      },

      all$Attrs({ $attrs, $props }) {
        return assignProps(
          {
            beforeUpload: this.beforeUpload,
            httpRequest: this.requestHandler
          },
          validData(DEFAULT_CONST[uploadType], {}),
          $attrs,
          $props
        )
      },

      domSize({ all$Attrs: { size } }) {
        return validData(SIZE_TYPE_LIST[size], size)
      },

      domStyle({ domSize }) {
        const domSizePx = setPx(domSize)
        return {
          width: domSizePx,
          height: domSizePx,
          lineHeight: domSizePx
        }
      },

      uploadSizSuffix({ domSize }) {
        const sortData = orderBy(Object.entries(SIZE_TYPE_LIST).map(([key, val]) => ({
          value: val,
          prop: key
        })), ['value'], ['desc'])
        const fItem = sortData.find(item => domSize >= item.value)
        if (fItem) return fItem.prop
        return SIZE_TYPE_LIST.mini
      }
    },

    methods: {
      //检查图片类型和尺寸
      async beforeUpload(file) {
        const beforeUploadFunc = validData(this.beforeUploadFunc, this.defaultBeforeUploadFunc)
        const isPass = await beforeUploadFunc.call(this, file)
        console.log('isPass', isPass)
        if (!isPass) return Promise.reject(isPass)
        return isPass
      },

      async defaultBeforeUploadFunc(file) {
        let { accept: typeArr = '', fileMaxSize, msg: { typeErr, sizeErr } } = this.all$Attrs
        if (typeof typeArr === 'string' && typeArr) typeArr = typeArr.split(/[,，]\s*/)
        let includeType = typeArr.includes(file.type) || typeArr.includes(`.${last(file.name.split('.'))}`)
        const isMoreSize = file.size / 1024 / 1024 > fileMaxSize
        if(!typeArr.length) includeType = true
        if (!includeType) {
          const typeErrMsg = replaceErrorMsg(typeErr, typeArr.join(','))
          this.$message.error(typeErrMsg)
        }
        if (isMoreSize) {
          this.$message.error(replaceErrorMsg(sizeErr, fileMaxSize))
        }
        const normalValid = includeType && !isMoreSize
        if (!normalValid) return normalValid
        if (!this.isOpenAnalysisImageType) return true
        return await this.analysisImageType(file, typeArr)
      },

      async analysisImageType(file, typeArr = []) {
        let { msg: { suffixErr, fileTypeEmptySuffixErr, imageInfoEmptyErr } } = this.all$Attrs
        typeArr = typeArr || []
        if (!typeArr.length) return true
        const array = await file2Uint8Array(file)
        let imageInfo = await getImageType(array)
        if (!imageInfo) {
          imageInfo = {
            mime: replaceErrorMsg(imageInfoEmptyErr, file.type)
          }
        }
        const includeType = typeArr.includes(imageInfo.mime)
        if (includeType) return true
        if (file.type) {
          this.$message.error(replaceErrorMsg(suffixErr, [file.name || '', imageInfo.mime, file.type]))
        } else {
          this.$message.error(replaceErrorMsg(fileTypeEmptySuffixErr, typeArr.join(',')))
        }
        return false
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
          return
        }
        this.$emit('deleteUploadImgHandler', {
          file,
          index
        })
      },

      //自定义上传
      requestHandler(info) {
        const { file } = info
        this.temFilesList.push(file)
        this.timer && clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.$emit('update:files', this.temFilesList)
          this.$emit('updateFiles', this.temFilesList)
        }, 100)
      },

      clearFiles() {
        this.temFilesList = []
        let { elUpload } = this.$refs
        if (elUpload) {
          return elUpload.clearFiles()
        }
      }
    }
  }
}
