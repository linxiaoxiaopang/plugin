export class BaiduAi {
  constructor(
    {
      file
    }
  ) {
    this.file = file
    this.retryCount = 0
  }

  async fileToBase64() {
    const { fileToBase64 } = await import(chrome.runtime.getURL('./content/utils/imageUtils.js'))
    return await fileToBase64(this.file)
  }

  async picUpload() {
    const { getPictureParams } = await import(chrome.runtime.getURL('./content/module/getToken.js'))
    const picInfo = await this.fileToBase64()
    const { token, timestamp } = getPictureParams(picInfo)
    const formData = {
      token,
      scene: 'pic_edit',
      picInfo,
      timestamp,
      pageFr: ''
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
    })
    if (!res?.data?.url) throw '上传图片失败'
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
      form.retryCount = ++this.retryCount
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
    if (!res?.pcEditTaskid) throw '抠图失败'
    if (res.isGenerate && res.status === 4) {
      return await new Promise(async resolve => {
        setTimeout(async () => {
          const res = await this.cutout()
          resolve(res)
        }, 2000)
      })
    }
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
      return await new Promise(async resolve => {
        setTimeout(async () => {
          const res = await this.pcquery(task)
          resolve(res)
        }, 2000)
      })
    }
    const resUrl = res?.picArr?.[0]?.url
    if (!resUrl) throw '获取图片失败'
    return resUrl
  }

  async action() {
    try {
      const url = await this.picUpload()
      const cutoutRes = await this.cutout(url)
      const res = await this.pcquery(cutoutRes)
      console.log('res', res)
    } catch (err) {
      console.log(err)
    }
  }
}
