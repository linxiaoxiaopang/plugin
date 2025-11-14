import { file2Uint8Array, getImageType, getPicName } from '@/utils'
import { find } from 'lodash'
const SIZE = 200

export default {
  props: {
    files: {
      type: Array,
      default: () => []
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
    alwaysShowUploadBtn: {
      default: false
    },
    isOpenAnalysisImageType: Boolean,

    vaildUniqueFileName: Boolean
  },
  data() {
    return {
      temFilesList: []
    }
  },
  watch: {
    files: {
      handler(newVal) {
        this.temFilesList = newVal
      },
      deep: true
    }
  },
  filters: {
    //格式化图片地址
    formatRowUrl(file) {
      const url = file.url || file.path
      if (url) {
        if (!/^http/.test(url)) {
          // eslint-disable-next-line
          return `${serverRootPath}${url}`
        }
        return url
      }
      return URL.createObjectURL(file)
    }
  },
  computed: {
    showUploadBtn({ alwaysShowUploadBtn }) {
      if (alwaysShowUploadBtn) return alwaysShowUploadBtn
      if (!this.$attrs.limit) {
        return true
      }
      return this.$attrs.limit > this.files.length
    },
    getFileName() {
      return (file) => {
        const fileName = getPicName(file.url || file.path || '')
        console.log('fileName', fileName)
        return fileName
      }
    }
  },
  methods: {
    //检查图片类型和尺寸
    async beforeUpload(file) {
      const success = await this.beforeUploadHandler(file)
      if (!success) return Promise.reject(success)
      return true
    },

    async beforeUploadHandler(file) {
      if (this.beforeUploadFunc) {
        return this.beforeUploadFunc(file)
      }
      let typeArr = this.$attrs.accept || ['image/png', 'image/jpg', 'image/jpeg']
      console.log('typeArr', typeArr)
      if (typeof typeArr === 'string') {
        typeArr = typeArr.split(/[,，]\s*/)
        // console.log('typeArr', typeArr)
      }
      // console.log('file.type', file.type)
      const includeType = typeArr.includes(file.type)
      // console.log('includeType', includeType)
      const size = this.$attrs.picSize || SIZE
      const isMoreSize = file.size / 1024 / 1024 < size
      if (!includeType && typeArr.length) {
        this.$message.error(`上传文件只能是 ${typeArr.join(',')} 格式!`)
      }
      if (!isMoreSize) {
        this.$message.error(`上传图片文件不能超过 ${size}MB!`)
      }
      const normalValid = includeType && isMoreSize
      if (!normalValid) return normalValid
      if(!this.isOpenAnalysisImageType) return true
      return await this.analysisImageType(file, typeArr)
    },

    async analysisImageType(file, typeArr = []) {
      typeArr = typeArr || []
      if (!typeArr.length) return true
      const array = await file2Uint8Array(file)
      let imageInfo = await getImageType(array)
      if(!imageInfo) {
        imageInfo = {
          mime: `非${file.type}的文件的后缀`
        }
      }
      const includeType = typeArr.includes(imageInfo.mime)
      if (includeType) return true
      if (file.type) {
        this.$message.error(`${file.name || ''}文件后缀异常，${imageInfo.mime}被修改为${file.type}`)
      } else {
        this.$message.error(`上传文件异常，只能是 ${typeArr.join(',')} 格式!`)
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
      console.log('info', info)
      const { action, file } = info
      if (this.vaildUniqueFileName) {
        const findFile = find(this.temFilesList, { name: file.name })
        if (!findFile) this.temFilesList.push(file)
      } else {
        this.temFilesList.push(file)
      }
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
