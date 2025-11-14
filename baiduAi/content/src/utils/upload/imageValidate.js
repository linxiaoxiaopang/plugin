/* eslint-disable */
import { formatFileByUrl, getFileByUrl } from '@/utils/upload/imageUtil'
import { checkColorTypeAndImageType, checkPicName } from '@/utils'
import { validatenull, validatePipe } from '@/components/avue/utils/validate'
import { formatValidates } from '@/utils/validate/common'
import { UploadClass } from '@/utils/utils/classUtils/uploadClass'

export const remarks = {
  disable: '图片已禁用',
  repeat: '图片重复上传',
  imageType: '文件后缀异常（仅支持png、 jpg、jpeg格式）',
  invalidUrl: '无效链接',
  emptyUrl: '未上传图片内容'
}

export class ImageValidate {
  constructor(file) {
    this.__file = file
    this.setFile(file)
    console.log('ImageValidate', this)
  }
  validate = () => {
    return this.validatePipe(
      'checkImageDisable',
      'checkPicName',
      'checkColorTypeAndImageType'
    )
  }
  validateImageContent = () => {
    return this.validatePipe(
      'checkValue',
      this.validate
    )
  }
  validateImage = () => {
    return this.validatePipe(
      'checkPicName',
      'checkColorTypeAndImageType'
    )
  }
  
  validatePipe = async (...validates) => {
    await this.getFile()
    try {
      return await validatePipe(
        ...this.formatValidates(validates)
      )
    } catch (e) {
      this.__file.isError = true
      this.__file.errMsg = e
      throw e
    }
  }
  setFile = async (file) => {
    file = formatFileByUrl(file)
    if (UploadClass.isUploadSuccessFile(file)) return this.file = file
    this.file = await (this.filePromise = getFileByUrl(file))
  }
  getFile = async () => {
    return this.filePromise
  }
  
  formatValidates(validates) {
    return formatValidates(ImageValidate, validates, [this.file])
  }
  
  static checkImageDisable(file) {
    const isUploaded = UploadClass.isUploadSuccessFile(file)
    if (isUploaded && file.disable) throw file.remark = remarks.disable
    return true
  }
  static checkPicName = (file) => {
    try {
      file.name = file.name || file.title
    } catch {}
    
    if (!file.name) throw '图片名称校验失败'
    
    const [, , errMsg] = checkPicName([file], false)
    if (errMsg) throw errMsg
    return true
  }
  static checkColorTypeAndImageType = async (file) => {
    let { raw } = file
    if (isUploadFile(file)) raw = file
    try {
      const res = await checkColorTypeAndImageType(raw)
      if (res.cmyk) {
        file.isCMYK = res.cmyk
      }
      if (res.type) {
        file.isErrType = res.type
      }
    } catch {}
    if (file.isCMYK) {
      throw `${file.isCMYK}通道图片（请使用PS等工具，将图片保存为RGB格式）`
    }
    if (file.isErrType) {
      throw remarks.imageType
    }
    return true
  }
  static checkValue = (file) => {
    if (!file?.url) {
      throw remarks.emptyUrl
    }
    return true
  }
}

export function validateImageContent(file) {
  const imageValidate = new ImageValidate(file)
  return imageValidate.validateImageContent()
}

export function validateImage(file) {
  if (validatenull(file)) return true
  
  const imageValidate = new ImageValidate(file)
  return imageValidate.validateImage()
}
export function validateFiles(files) {
  if (validatenull(files)) return true
  
  files = [].concat(files)
  return validatePipe(
    ...files.map(file => () => validateImage(file))
  )
}


// 是否是UploadPicToOss允许上传的文件类型
export function isUploadFile(file) {
  return isFile(file) || isBlob(file)
}
export function isFile(file) {
  return file instanceof File
}
export function isBlob(file) {
  return toString.call(file) === '[object Blob]'
}