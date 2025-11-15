import { getPictureParams } from './getToken'
import { uploadToOssUseFile } from '@/utils/oss'
import { base64ToFile, isBase64 } from '@/utils'

export class BaiduAi {
  constructor(
    {
      file,
      useOss
    }
  ) {
    this.file = file
    this.useOss = useOss
    // this.url = URL.createObjectURL(file)
    this.title = file.name
    this.total = file.size
    this.maxRetryCount = 5
    this.uploadRetryCount = 0
    this.retryCount = 0
    this.status = 'ready'
    this.resUrl = ''
    this.remark = ''
    this.progress = {
      upload: 0,
      cutout: 0
    }
  }

  get finished() {
    return this.status === 'success' || this.status === 'failed'
  }

  async fileToBase64() {
    return await fileToBase64(this.file)
  }

  async picUploadToOss() {
    const res = await uploadToOssUseFile(this.file)
    if (!res.url) throw '上传图片失败'
    return res.url
  }

  async base64ToUploadOss(file) {
    if (!isBase64(file)) return file
    const res = await uploadToOssUseFile(base64ToFile(file, this.title))
    if (!res.url) throw 'base64转图片上传失败'
    return res.url
  }

  async picUpload() {
    const picInfo = await this.fileToBase64()
    const { token, timestamp } = getPictureParams(picInfo)
    const formData = {
      token,
      scene: 'pic_edit',
      picInfo,
      timestamp,
      pageFr: ''
    }
    if (this.uploadRetryCount > 0) {
      formData.uploadRetryCount = this.uploadRetryCount
    }
    const urlEncodedData = new URLSearchParams()
    Object.entries(formData).forEach(([key, value]) => {
      urlEncodedData.append(key, value)
    })
    const res = await fetch('https://image.baidu.com/aigc/pic_upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: urlEncodedData.toString()
    }).then(res => {
      return res.json()
    }).catch(() => false)
    if (!res?.data?.url && this.uploadRetryCount < this.maxRetryCount) {
      this.uploadRetryCount++
      return await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          const res = await this.picUpload().catch(err => reject(err))
          resolve(res)
        }, 2000 * this.uploadRetryCount)
      })
    }
    if (!res?.data?.url) throw res.message || '上传图片失败'
    return res?.data?.url
  }

  async getApplid() {
    const url = 'https://image.baidu.com/search/index?showMask=1&fr=csaitab&tn=baiduimage&toolType=1&word=bdaitpzs%E7%99%BE%E5%BA%A6AI%E5%9B%BE%E7%89%87%E5%8A%A9%E6%89%8Bbdaitpzs&qq-pf-to=pcqq.c2c&login_type=qzone'
    const res = await fetch(url, {
      method: 'get'
    }).then(res => {
      return res.text()
    }).then(text => {
      return text.match(/"lid":\s*"(\d+)"/)[1]
    })
    return res
  }

  async cutout(url) {
    const applid = await this.getApplid()
    const form = {
      query: 'bdaitpzs百度AI图片助手bdaitpzs',
      picInfo: '',
      picInfo2: '',
      type: 9,
      text: '',
      ext_ratio: '',
      expand_zoom: '',
      original_url: url,
      thumb_url: url,
      front_display: 0,
      create_level: 0,
      image_source: 1,
      style: '',
      queryFeature: '',
      imageFeature: '',
      channel: 'edit',
      page_fr: 'csaitab',
      search_id: '',
      applid,
      querycate83: 3,
      sa: '',
      pic_fr: 0
    }
    if (this.retryCount > 0) {
      form.retryCount = this.retryCount
    }
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value)
    })
    const res = await fetch('https://image.baidu.com/aigc/pccreate', {
      method: 'POST',
      body: formData
    }).then(res => {
      return res.json()
    })
    if (res.isGenerate && res.status === 4 && this.retryCount < this.maxRetryCount) {
      this.retryCount++
      return await new Promise(async resolve => {
        setTimeout(async () => {
          const res = await this.cutout()
          resolve(res)
        }, 2000)
      })
    }
    if (!res?.pcEditTaskid) throw res?.message || '抠图失败'
    return res
  }

  async pcquery(task) {
    const params = {
      taskId: task.pcEditTaskid,
      query: 'bdaitpzs百度AI图片助手bdaitpzs',
      image_source: 1
    }
    const queryString = new URLSearchParams(params).toString()
    const url = `https://image.baidu.com/aigc/pcquery?${queryString}`
    const res = await fetch(url, {
      method: 'get'
    }).then(res => {
      return res.json()
    })
    if (res.isGenerate === false) {
      this.progress.cutout = res.progress
      return await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          const res = await this.pcquery(task).catch(err => reject(err))
          resolve(res)
        }, 2000)
      })
    }
    const resUrl = res?.picArr?.[0]?.url || res?.picArr?.[0]?.src
    if (!resUrl) throw '获取图片失败'
    this.progress.cutout = res.progress
    return resUrl
  }

  async action() {
    try {
      this.status = 'uploading'
      let url = ''
      if (this.useOss) {
        url = await this.picUploadToOss(this.file)
      } else {
        url = await this.picUpload()
      }
      this.status = 'create'
      const cutoutRes = await this.cutout(url)
      this.status = 'cutout'
      this.resUrl = await this.pcquery(cutoutRes).then(async res => {
        return await this.base64ToUploadOss(res)
      })
      this.status = 'success'
    } catch (err) {
      this.remark = err
      this.status = 'failed'
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    // 读取文件为 DataURL（Base64 格式）
    reader.readAsDataURL(file)
    // 读取成功
    reader.onload = (e) => resolve(e.target.result)
    // 读取失败
    reader.onerror = (error) => reject(error)
  })
}
