/* eslint-disable */
import store from '@/store'
import LimitQueue from '@/utils/utils/limitQueue'
import { UniqMapClass } from '@/utils/utils/classUtils/uniqClass'
import { Message } from 'element-ui'
import { compressErrorPatch, compressFile } from '@/utils/utils/imageUtil'
import {
  chain,
  flatMapDeep,
  forEach,
  groupBy,
  isArray,
  isPlainObject,
  last,
  map,
  merge,
  mergeWith,
  pick,
  set
} from 'lodash'
import { getPicName } from '@/utils'
import { validatenull, validatePipe } from '@/components/avue/utils/validate'
import { getFileByUrl } from '@/utils/upload/imageUtil'
import { ImageValidate, isUploadFile, remarks } from '@/utils/upload/imageValidate'
import { getResult } from '@/utils/functional'
import { FILE_PREFIX } from '@/utils/constant/systemConst'
import { cacheWrap } from '@/utils/cache/cacheUtils'

export const uniqImageUpload = new UniqMapClass({
  async clearTiming(key, value, clear) {
    try {
      const file = await value
      if (file.status === status.error) throw file.remark
      setTimeout(clear, 5000)
    } catch (e) {
      clear()
    }
  }
})
export const notUniqUpload = new UniqMapClass({
  clearTiming: 'none'
})

export const status = {
  start: '0',
  success: '3',
  error: '4'
}

const IMAGE_OPTION = {
  // 不是文件对象且有url：先下载url图片Blob，在上传Blob
  fileHandler: getFileByUrl,
  validate(file) {
    const imageValidate = new ImageValidate(file)
    return imageValidate.validate()
  },
  getParams({ file, uploadedOssPicObj }) {
    return {
      disable: 0,
      path: uploadedOssPicObj.path,
      thumbnailPath: uploadedOssPicObj.thumbnailPath,
      ...pick(file, ['title', 'width', 'height'])
    }
  }
}
const DEFAULT_OPTIONS = {
  custom: {
    fileType: 'material',
    isCompress: true,
    isReplaceFiles: true,
    // errHandlerTypes: 'replace',
    // sucHandlerTypes: 'replace',
    warningOption: 'disable',
    uniqKey: 'title',
    uniqUpload: uniqImageUpload,
    getParams: IMAGE_OPTION.getParams,
    upload: file => file
  },
  uploadOSS: {
    fileType: 'abandon',
    isComplex: true,
    isReplaceFiles: true,
    getParams: IMAGE_OPTION.getParams,
    upload: file => file,
    sucHandlerTypes: 'fillPath',
    isUploadSuccessFile: file => !!file.path
  }
}
const DEFAULT_OPTION = {
  type: 'custom',
  uniqUpload: notUniqUpload,
  validate: true,
  error: () => {},
  success: () => {},
  isUploadFile,
  isUploadSuccessFile
}

export class UploadClass {
  constructor() {
    this.queueInstance = new LimitQueue()
  }

  action = async (option) => {
    const normalizedOption = UploadClass.normalizeOption(option)
    let { isReplaceFiles, isThrowError, warningOption, isComplex } = normalizedOption

    let { uploadFiles } = this
    if (isComplex) {
      uploadFiles = this.complex.uploadFiles
    }

    const result = await uploadFiles(normalizedOption)

    const sucFiles = result.getSucFiles()
    forEach(sucFiles, file => {
      delete file.raw // 防止被complex抓取二次上传
      file.isUploaded = true // 防止被getFileByUrl请求，重新添加raw
    })

    if (warningOption) UploadClass.errWarning(result.result, normalizedOption)

    if (isReplaceFiles) result.replaceFiles()

    if (isThrowError && !validatenull(result.getErrFiles())) throw '图片上传失败'

    return result
  }
  uploadFiles = async (option) => {
    const normalizedOption = UploadClass.normalizeOption(option)
    // console.log('normalizedOption', normalizedOption)
    let { files } = normalizedOption

    const awaitArray = UploadClass.awaitArray(files.length)
    const normalizedFiles = UploadClass.normalizeFile(files, normalizedOption)
    // console.log('normalizedFiles', normalizedFiles, files, awaitArray)
    this.addQueue(
      normalizedFiles.map((file, index) => async () => {
        // 递归files
        if (isArray(file)) {
          this.uploadFiles({ ...option, files: file }).then(res => awaitArray.add(index, res.result))
          return
        }

        try {
          file = await this.uploadFile(file, normalizedOption)
        } catch (e) {
          console.log(e)
        }
        awaitArray.add(index, file)
        return file
      })
    )
    const result = await awaitArray.promise
    return {
      result,
      files,
      normalizedFiles,
      replaceFiles: cacheWrap(() => UploadClass.replaceFiles(files, result, normalizedOption)),
      getSucFiles: cacheWrap(() => UploadClass.getSucFiles(result, normalizedOption)),
      getErrFiles: cacheWrap(() => UploadClass.getErrFiles(result, normalizedOption))
    }
  }
  async uploadFile(file, option) {
    const {
      uniqUpload,
      error,
      errHandlerTypes,
      success,
      sucHandlerTypes,
      isUploadSuccessFile
    } = UploadClass.normalizeOption(option)

    // 防止相同名称图片重复上传
    // 待上传图片如果存在多个相同名称图片时，只上传一个
    let delaySet = uniqUpload.delaySet()

    const handler = async () => {
      // 避免重复上传
      if (isUploadSuccessFile(file)) {
        file.status = status.success
        delaySet({ key: file.title })
        return file
      }

      try {
        file = await this.fileHandler(file, option)

        // 如果存在正在上传相同标题图片时，中断上传，并返回上传图片的数据
        if (typeof option.uniqKey === 'function') {
          const uniqKey = option.uniqKey(file)
          const promise = uniqUpload.get(uniqKey)
          if (promise) {
            const repeatTitleFile = await promise
            // 将上传图片的数据合并进当前图片
            merge(file, repeatTitleFile)
            await success(file)
            return file
          }
          delaySet({ key: uniqKey })
        }


        const res = await this.uploadHandler(file, option)

        file.status = status.success
        file.id = res?.detail
        await this.sucHandler(sucHandlerTypes, file)
        await success(file, res)
      } catch (e) {
        console.log(e)
        file.status = status.error
        file.remark = e
        await this.errHandler(errHandlerTypes, file)
        await error(file, handler)
      }
      return file
    }
    const p = handler()
    delaySet({ value: p })
    return p
  }
  async uploadHandler(file, option) {
    // console.log('option', option)
    const {
      validate,
      getParams,
      upload
    } = option

    file = await this.fileHandler(file, option)

    const valid = await getResult(validate, file)
    if (!valid) throw '校验失败'
    const uploadedOssPicObj = await this.uploadFile2OSS(file, option)
    if (!uploadedOssPicObj) throw '图片上传失败-001'

    const data = { file, uploadedOssPicObj, option }
    const params = await getResult(getParams, data)
    return getResult(upload, params, data)
  }
  async uploadFile2OSS(file, { isCompress, options1 = {} }) {
    file.status = status.start

    const options = [
      {
        files: [file.raw],
        dirPrefix: $ossDirMapWithType[file.fileType],
        fileType: file.fileType,
        prop: 'path',
        config: {
          onUploadProgress: (progressEvent) => {
            console.log('onUploadProgress')
            const { total = 0.000001, loaded = 0 } = progressEvent || {}
            Object.assign(file, {
              loaded,
              total,
              status: total == loaded ? '2' : '1'
            })
          }
        },
        sucCallBack: (res) => {
          console.log('sucCallBack')
          file.status = status.success
        },
        errCallBack: (res) => {
          console.log('errCallBack')
          file.status = status.error
        }
      }
    ]
    if (isCompress) {
      await UploadClass.compressFile(file)
      options.push({
        files: [file.thumbnailPath],
        prop: 'thumbnailPath',
        dirPrefix: $ossDirMapWithType[file.fileType],
        fileType: file.fileType,
        uuidSuffix: '_t'
      })
    }
    const uploadedOssPicObj = await $uploadOSSPics(options, options1)
    if (!uploadedOssPicObj) return

    file.url = uploadedOssPicObj.path
    file.path = uploadedOssPicObj.path

    if (isCompress) {
      // 图片压缩失败补丁，电脑运行环境不佳，导致canvas会导致空白图片，发生这种情况，采用oss压缩
      uploadedOssPicObj.thumbnailPath = await compressErrorPatch(file.thumbnailPath, uploadedOssPicObj.thumbnailPath, uploadedOssPicObj.path, file.fileType)
      file.thumbnailPath = uploadedOssPicObj.thumbnailPath
    }


    return uploadedOssPicObj
  }
  async fileHandler(file, { fileHandler }) {
    if (file.$isFileHandler) return file
    file.$isFileHandler = true

    file = await IMAGE_OPTION.fileHandler(file) || file
    file = await getResult(fileHandler, file) || file
    return file
  }

  complex = {
    uploadFiles: async (option) => {
      const normalizedOption = UploadClass.normalizeOption(option)
      const files = UploadClass.getFiles(normalizedOption)
      const result = await this.uploadFiles({ ...normalizedOption, files: map(files, 'file') })
      const { replaceFiles } = result
      result.replaceFiles = cacheWrap(() => {
        const replacedFiles = replaceFiles()
        return this.complex.replaceFiles(replacedFiles, files, normalizedOption)
      })
      return result
    },
    replaceFiles: (replacedFiles, files, { isUploadSuccessFile }) => {
      forEach(replacedFiles, (file, index) => {
        if (isUploadSuccessFile(file)) {
          const { top, parent, path } = files[index]
          isArray(parent) ? parent.splice(last(path), 1, file) : set(top, path, file)
        }
      })
    }
  }


  errHandlers = {
  }
  errHandler = async (errHandlerTypes, ...args) => {
    return this.executeHandlers(this.errHandlers, errHandlerTypes, args)
  }
  sucHandlers = {
    fillPath: fillFilePath
  }
  sucHandler = async (sucHandlerTypes, ...args) => {
    return this.executeHandlers(this.sucHandlers, sucHandlerTypes, args)
  }
  executeHandlers(handles, types, args) {
    if (validatenull(types)) return
    types = [].concat(types)
    return validatePipe(
      ...types.map(type => {
        type = [].concat(type)
        return type.map(type => {
          return handles[type]?.bind(this, ...args)
        })
      })
    )
  }


  addQueue = (queues) => {
    this.queueInstance.concat(queues)
  }

  static errWarning(result, option) {
    let { warningOption } = option
    const errFiles = UploadClass.getErrFiles(result, option)
    if (validatenull(errFiles)) return

    warningOption = [].concat(warningOption)

    const errFilesGroup = groupBy(errFiles, 'remark')
    for (const warningItem of warningOption) {
      const errMsg = remarks[warningItem]
      const disableFiles = errFilesGroup[errMsg]
      if (disableFiles) {
        const titleStr = chain(disableFiles)
          .map('title')
          .uniq()
          .slice(0, 5)
          .join('、')
          .value()
        Message.warning(`${ titleStr }等${ errMsg }`)
      }
    }
  }
  static normalizeOption(option = {}) {
    if (option.$isNormalizedOption) return option

    // 使用了merge之后，files变成了一个新对象？如果合并值为对象且目标对象不存在这个合并值，则会新建一个对象来接收合并值的属性值
    // 解决方法：将files赋值给merge的目标对象（{ files: option.files }）
    const type = option.type || DEFAULT_OPTION.type
    option = merge({ files: option.files, $isNormalizedOption: true }, DEFAULT_OPTION, DEFAULT_OPTIONS[type], option)

    if (typeof option.uniqKey === 'string') {
      const { uniqKey } = option
      option.uniqKey = (file) => file[uniqKey]
    }

    return option
  }
  static async uploadFile(file, isCompress) {
    if (isCompress) {
      await UploadClass.compressFile(file)
    }

    const [err1, res] = await awaitWrap(store.dispatch('UploadFile', file))
    if (err1 instanceof Error) throw '图片上传失败'
    if (err1 || !$SUC(res)) {
      throw err1 || res?.message || '图片上传失败'
    }
    return res
  }
  static compressFile(file) {
    return compressFile(file.raw).then((compressItem) => {
      if (compressItem) {
        const { file: fileObj, rawFile, naturalWidth, naturalHeight } = compressItem
        if(rawFile) file.raw = rawFile
        file.thumbnailPath = fileObj
        file.width = naturalWidth
        file.height = naturalHeight
      } else {
        throw '上传失败'
      }
    })
  }
  static normalizeFile(file, option) {
    if (isArray(file)) return file.map(item => UploadClass.normalizeFile(item, option))

    if (option.isUploadFile(file)) file = { ...file, ...pick(file, ['fileType', 'name']), raw: file }
    file.fileType = file.fileType || option.fileType
    file.title = file.title || getPicName(file.name || '')
    try {
      const name = file.name || file.title
      const type = file.raw?.type || file.type
      if (!name?.includes('.') && type) {
        file.name = `${ name }.${ type.split('/').pop() }`
        if (file.raw) file.raw.name = file.name
      }
    } catch {}
    return file
  }
  // 当add调用次数等于length时，返回promise值
  static awaitArray(length) {
    let count = 0
    const result = []
    let resolve = () => {}
    return {
      promise: new Promise(resolveFn => {
        if (length === 0) return resolveFn(result)
        resolve = resolveFn
      }),
      add(index, value) {
        result[index] = value

        if (++count === length) resolve(result)
      }
    }
  }
  static replaceFiles(files, result, option) {
    const isArr = isArray(files)
    return mergeWith(files, result, (ObjValue, srcValue, i) => {
      if (isArray(ObjValue)) return UploadClass.replaceFiles(ObjValue, srcValue, option)
      if (option.isUploadSuccessFile(srcValue)) {
        isArr && files.splice(i, 1, ObjValue)
        return srcValue
      }
      return ObjValue
    })
  }
  static isUploadSuccessFile = isUploadSuccessFile
  static getSucFiles(files, option) {
    return flatMapDeep(files, file => {
      if (isArray(file)) return UploadClass.getSucFiles(file, option)
      return option.isUploadSuccessFile(file) ? file : []
    })
  }
  static getErrFiles(files, option) {
    return flatMapDeep(files, file => {
      if (isArray(file)) return UploadClass.getErrFiles(file, option)
      return option.isUploadSuccessFile(file) ? [] : file
    })
  }

  static getFiles({ files, isUploadFile }) {
    if (validatenull(files)) return
    files = isArray(files) ? files : [files]
    const map = new Map() // 防止循环遍历某个对象
    return handler(files)
    function handler(files, { result = [], path = [], parent = files, top = files } = {}) {
      if (map.get(files)) return
      if (isUploadFile(files)) {
        result.push({
          file: files,
          path,
          parent,
          top
        })
      } else if (isPlainObject(files) || isArray(files)) {
        map.set(files, true)
        forEach(files, (file, key) => {
          if (key === 'originalFile') return
          handler(file, { result, path: [...path, key], top, parent: files })
        })
      }
      return result
    }
  }
}
export function isUploadSuccessFile(file) {
  return !!file?.id
}

export const uploadInstance = new UploadClass()

export function fillFilePath(file) {
  ['url', 'path', 'thumbnailPath'].forEach(key => file[key] && (file[key] = fillPath(file[key])))
}
export function fillPath(path) {
  return FILE_PREFIX + path.replace(/^\//, '')
}
