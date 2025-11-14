/* eslint-disable */
import { FormatObject } from '@/utils/format/object'
import { isString } from 'lodash'
import { analysisFileByAxios, getFillFileName, getPicName } from '@/utils'
import { isUploadFile } from '@/utils/upload/imageValidate'


export async function getFileByUrl(file) {
  file = formatFileByUrl(file)
  
  // 不是文件对象且有url
  if (file.isUploaded || file.raw || !file.url || isUploadFile(file)) return file
  
  file.raw = await analysisFileByAxios(file.url, { passFileReader: true })
  // console.log('Blob', file.raw, file)
  if (!file.raw) throw '图片链接解析失败'
  file.isGetByUrl = true
  file.size = file.raw.size
  file.type = file.raw.type
  file.name = file.raw.name = file.name || file.raw.name || getFillFileName(file.url)
  file.title = getPicName(file.name || '')
  return file
}

export function formatFileByUrl(file) {
  if (isString(file)) file = { url: file }
  return file || {}
}


export function formatImage(image, map) {
  return Object.assign({ ...image }, FormatObject.format(image, {
    imageId: 'id',
    name: 'title',
    url: 'thumbnailPath',
    thumbnailPath: 'thumbnailPath',
    ...map
  }))
}