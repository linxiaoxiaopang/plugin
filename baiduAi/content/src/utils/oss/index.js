import OSS from './ossSdk'
import axios from 'axios'
import { ossOption } from './const'

const client = new OSS(ossOption)

export async function uploadToOssUseUrl(url) {
  try {
    const file = await analysisFileByAxios(url, { passFileReader: true })
    const fileName = getFillFileName(url)
    const randomFileName = getRandom() + fileName
    const options = {}
    const result = await client.put(randomFileName, file, options)
    console.log('result', result)
    return result
  } catch (err) {
    throw err
  }
}

export async function uploadToOssUseFile(file) {
  try {
    const fileName = file.name
    const randomFileName = getRandom() + fileName
    const result = await client.put(randomFileName, file)
    return result
  } catch (err) {
    throw err
  }
}

function getRandom() {
  return Math.random().toString(36).substr(2) + Date.now()
}

function getFileName(path = '') {
  path = (path || '').split('?')[0]
  const pointLastIndex = path.lastIndexOf('.')
  const chaLastIndex = path.lastIndexOf('/')
  return path.slice(chaLastIndex + 1, pointLastIndex)
}

function getFileSuffix(path = '') {
  path = path || ''
  const chaLastIndex = path.lastIndexOf('.')
  const name = path.slice(chaLastIndex + 1)
  return name.split('?')[0]
}

function getFillFileName(path = '') {
  return `${getFileName(path)}.${getFileSuffix(path)}`
}

function analysisFileByAxios(url, config = {}) {
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
      throw err
    })
}
