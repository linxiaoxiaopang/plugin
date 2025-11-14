/* eslint-disable */
import cptable from 'codepage'
import * as XLSX from 'xlsx'
import { Message } from 'element-ui'
import axios from 'axios'
import store from '@/store'
import { validatenull } from '@/components/avue/utils/validate'
import { OSS_SEPARATOR } from '@/utils/constant'
import { createRandomNum } from '@/utils'

// 百度图片审核接口
function sendPicToBaiduCheck(base64) {
  const formData = new FormData()
  formData.append('image', base64.split(',')[1])
  formData.append('imgType', 0)
  return axios({
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'post',
    url: `https://www.zdcustom.com/baiduApi/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${store.getters.baidu_access_token}`,
    data: formData
  })
}

// 检查图片内容是否有违规，调用百度图片审核接口,传入图片file数组，返回值检测结果的数组
export async function checkPicIsLegal(thumDataArr) {
  if (!Array.isArray(thumDataArr)) return
  if (thumDataArr.length === 0) return
  const arr = thumDataArr.map(async ({ file }) => {
    // console.log('filr',file);
    if (validatenull(file)) return
    const base64 = await file2Base64(file)
    return sendPicToBaiduCheck(base64)
  })
  return Promise.all(arr)
}


export function file2Base64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(null)
  })
}

export function isFile(file) {
  return file instanceof File
}

export function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

export function getFileName(path = '') {
  path = (path || '').split('?')[0]
  const pointLastIndex = path.lastIndexOf('.')
  const chaLastIndex = path.lastIndexOf('/')
  return path.slice(chaLastIndex + 1, pointLastIndex)
}

export function getFileSuffix(path = '') {
  path = path || ''
  const chaLastIndex = path.lastIndexOf('.')
  const name = path.slice(chaLastIndex + 1)
  return name.split('?')[0]
}

export function getFillFileName(path = '') {
  return `${getFileName(path)}.${getFileSuffix(path)}`
}

export function getRandomFileName(path, randCount = 4) {
  if (isFile(path) || isBlob(path)) path = path.name || ''
  return getFileName(path).split(OSS_SEPARATOR).shift() + '_' + createRandomNum(randCount) + '.' + getFileSuffix(path)
}

export function fileReader(file, readerType = 'readAsText', encoding) {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.onloadend = function (e) {
      resolve(e.target.result)
    }
    fileReader.onerror = function (e) {
      resolve(false)
    }
    fileReader[readerType](file, encoding)
  })
}

export function file2Content(file) {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.onloadend = function (e) {
      const result = e.target.result
      resolve(result)
    }
    fileReader.onerror = function (e) {
      resolve(false)
    }
    fileReader.readAsText(file, 'utf-8')
  })
}

export function file2Uint8Array(file) {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    fileReader.onloadend = function (e) {
      const result = e.target.result
      resolve(new Uint8Array(result))
    }
    fileReader.onerror = function (e) {
      resolve(false)
    }
    fileReader.readAsArrayBuffer(file)
  })
}

export function isUTF8(bytes) {
  var i = 0
  while (i < bytes.length) {
    if (
      // ASCII
      bytes[i] == 0x09 ||
      bytes[i] == 0x0a ||
      bytes[i] == 0x0d ||
      (0x20 <= bytes[i] && bytes[i] <= 0x7e)
    ) {
      i += 1
      continue
    }

    if (
      // non-overlong 2-byte
      0xc2 <= bytes[i] &&
      bytes[i] <= 0xdf &&
      0x80 <= bytes[i + 1] &&
      bytes[i + 1] <= 0xbf
    ) {
      i += 2
      continue
    }

    if (
      // excluding overlongs
      (bytes[i] == 0xe0 &&
        0xa0 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf) || // straight 3-byte
      (((0xe1 <= bytes[i] && bytes[i] <= 0xec) || bytes[i] == 0xee || bytes[i] == 0xef) &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf) || // excluding surrogates
      (bytes[i] == 0xed && 0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x9f && 0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xbf)
    ) {
      i += 3
      continue
    }

    if (
      // planes 1-3
      (bytes[i] == 0xf0 &&
        0x90 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf &&
        0x80 <= bytes[i + 3] &&
        bytes[i + 3] <= 0xbf) || // planes 4-15
      (0xf1 <= bytes[i] &&
        bytes[i] <= 0xf3 &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0xbf &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf &&
        0x80 <= bytes[i + 3] &&
        bytes[i + 3] <= 0xbf) || // plane 16
      (bytes[i] == 0xf4 &&
        0x80 <= bytes[i + 1] &&
        bytes[i + 1] <= 0x8f &&
        0x80 <= bytes[i + 2] &&
        bytes[i + 2] <= 0xbf &&
        0x80 <= bytes[i + 3] &&
        bytes[i + 3] <= 0xbf)
    ) {
      i += 4
      continue
    }
    return false
  }
  return true
}

/**
 * @description: XLSX读取文件对象
 * @param: f {File} 文件对象
 * @param: rABS {Boolean} 是否将文件读取为二进制字符串
 * @return:
 */
export function fileConvertToWorkbook(f) {
  var wb // 读取完成的数据
  var isCSV = ['csv', 'tsv'].includes(f.name.split('.').reverse()[0]) // 判断是否是 CSV
  return new Promise(async (resolve) => {
    let data = await file2Uint8Array(f)
    if (isCSV) {
      if (!isUTF8(data)) {
        var str = cptable.utils.decode(936, data)
        wb = XLSX.read(str, { type: 'string' })
      } else {
        data = await file2Content(f)
        wb = XLSX.read(data, {
          type: 'string',
          raw: true
        })
      }
    } else {
      wb = XLSX.read(data, {
        type: 'array'
      })
    }
    resolve(wb)
  })
}

/**
 * @description: 文件转换成二进制字符串
 * @param {String} url
 * @param {Object} config  axios配置项
 * @return {Promise}
 */
export function getBinaryString(url, config = {}) {
  config.fileReaderFuncName = 'readAsBinaryString'
  return analysisFileByAxios(url, config)
}

/**
 * @description: 通过url，解析转化文件
 * @param {String} url
 * @param {Object} config 配置项
 * config.fileReaderFuncName fileReader 名称 默认 readAsDataURL
 * config.responseType responseType axios返回的数据类型 默认blob
 * ...restConfig 其他配置项
 * @return {Promise}
 */
export function analysisFileByAxios(url, config = {}) {
  if (!config.responseType) {
    config.responseType = 'blob'
  }
  //fileReader 的方法
  if (!config.fileReaderFuncName) {
    config.fileReaderFuncName = 'readAsDataURL'
  }
  const { fileReaderFuncName, ...restConfig } = config
  return axios
    .get(url, {
      ...restConfig
    })
    .then((res) => {
      const { status, data } = res || {}
      if (status >= 200 && status < 300) {
        if (config.passFileReader) {
          return data
        }
        const fileReader = new FileReader()
        const p = new Promise((resolve, reject) => {
          fileReader.onloadend = function (e) {
            resolve(e.target.result)
          }
        })
        fileReader[fileReaderFuncName](data)
        return p
      }
    })
    .catch((err) => {
      const { message } = err
      if (message && message.cancelMessage) {
        Message.success('取消下载成功')
      }
      console.log(err)
    })
}

export function clipErrMsgTip(naturalWidth, naturalHeight) {
  Message.error(`切割宽度：${naturalWidth}像素, 切割高度：${naturalHeight}像素，切割图片尺寸过大，请调整切割尺寸后重试！`)
}
