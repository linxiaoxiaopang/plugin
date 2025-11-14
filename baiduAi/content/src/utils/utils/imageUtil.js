/* eslint-disable */
import axios from 'axios'
import Compressor from 'compressorjs'
import { createRandomNum, getUUID } from '../index'
import { OSS_DIR_MAP_WITH_TYPE, uploadOSSPics } from '@/commons/oss'
import { file2Uint8Array, analysisFileByAxios } from './fileUtil'
import { validData } from '@/components/avue/utils/util'
import { COMPRESS_MAX_NUM } from '@/utils/constant'
import { isString, isUndefined } from 'lodash'
import exifr from 'exifr/dist/full.esm.mjs'

const FileType = require('file-type/browser')

//图片处理
export function getImgData(src) {
  let lock = false
  let img = new Image()
  img.setAttribute('crossOrigin', 'Anonymous')
  let c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  return new Promise((resolve) => {
    img.onload = () => {
      const { width, height } = img
      c.width = width
      c.height = height
      c.setAttribute('id', 'img')
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, width, height)
      imgData.cols = width
      imgData.rows = height
      img.onerror = null
      img.onload = null
      c = null
      img = null
      resolve(imgData)
    }
    //解决本地跨域
    img.onerror = () => {
      if (!lock) {
        lock = true
        if (src.length < 200) {
          img.src = src + '?uid' + createRandomNum()
        } else {
          img.src = src
        }
      }
    }
    img.src = src
  })
}

export function getRedImgData(src) {
  let lock = false
  const img = new Image()
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  return new Promise((resolve) => {
    img.onload = () => {
      const { width, height } = img
      img.setAttribute('crossOrigin', 'Anonymous')
      c.width = width
      c.height = height
      // c.setAttribute("id", "img");
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, width, height)
      imgData.cols = width
      imgData.rows = height
      const widthRows = width * 4
      const data = imgData.data
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) {
          data[i] = 123 // red
          data[i + 1] = 175 // green
          data[i + 2] = 232 // blu
        }
      }

      ctx.putImageData(imgData, 0, 0)
      resolve(c)
      // const rand = parseInt(Math.random(0, width * height))
      // if (imgData.data[rand] > 0) {
      //   clearInterval(timer)
      //   resolve(imgData)
      // }
    }
    img.onerror = () => {
      if (!lock) {
        lock = true
        if (src.length < 200) {
          img.src = src + '?uid' + createRandomNum()
        } else {
          img.src = src
        }
      }
    }
    img.src = src
  })
}

export function getPixelByCoord({ data, cols }, coordX, coordY) {
  const num = parseInt(parseInt(coordX) * 4 + parseInt(coordY) * cols * 4)
  return [data[num], data[num + 1], data[num + 2], data[num + 3]]
}

export function getImgDom(src) {
  const img = new Image()
  return new Promise((resolve) => {
    img.onload = () => {
      setTimeout(() => {
        resolve(img)
      }, 500)
    }
    img.onerror = () => {
      resolve(null)
    }
    img.src = src
  })
}

export function getFileNameWithoutExpand(name) {
  name = name || ''
  return name.split('.')[0]
}

//rx,ry 围绕oX, oY点 获取旋转之后的角度
export function getRotatePoint({ rX, rY, oX, oY, angle }) {
  const { PI, cos, sin } = Math
  const rotate = (PI / 180) * -angle
  let x = (rX - oX) * cos(rotate) - (rY - oY) * sin(rotate) + oX
  let y = (rY - oY) * cos(rotate) + (rX - oX) * sin(rotate) + oY
  const dirX = x - rX
  const dirY = y - rY
  return {
    dirX,
    dirY,
    x,
    y
  }
}

//获取图片旋转之后的坐标
export function getImgRotatePos({ src, l, t, w, h, angle }) {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  const img = new Image()
  img.setAttribute('crossOrigin', 'Anonymous')

  return new Promise((resolve) => {
    img.onload = function() {
      const { PI } = Math
      // let rotate = 45
      const { width, height } = img
      c.width = width * 2
      c.height = height * 2

      const [oCenterPointX, oCenterPointY] = [c.width / 2 - width / 2, c.height / 2 - height / 2]
      ctx.translate(c.width / 2, c.height / 2)
      ctx.rotate((angle * PI) / 180)
      ctx.drawImage(img, -width / 2, -height / 2)

      const imgData = ctx.getImageData(0, 0, c.width, c.height)
      const obj = getPos(imgData)

      const { minX, minY, maxX, maxY } = obj

      const [rotateCenterPointX, rotateCenterPointY] = [
        (maxX - minX) / 2 + minX - width / 2,
        (maxY - minY) / 2 + minY - height / 2
      ]
      const [dirL, dirT] = [rotateCenterPointX - oCenterPointX, rotateCenterPointY - oCenterPointY]

      const { oL, oT, cX, cY } = getOriginCoord({ w, h, l, t, dirL, dirT, oW: width, oH: height })

      // getOriginCoord({ w: 1837, h: 1973, l: 143, t: 780, dirL: -160, dirT: 137.5, oW: 1485, oH: 1740 })

      resolve({
        dirL, //旋转前后的中心旋转点的left坐标位移差
        dirT, //旋转前后的中心旋转点的top坐标位移差
        oL, //旋转前的左上角坐标left
        oT, //旋转前的左上角坐标top
        cX, //旋转前的中心坐标left
        cY //旋转前的中心坐标Top
      })

      // console.log('obj1', obj1)
      // document.body.append(c)
    }
    // img.src = require('./d1_0_angle.png')
    // img.src = require('./0_angle.png')
    img.src = src
  })

  //获取图片未旋转之前的左上角坐标位置
  function getOriginCoord({ w, h, l, t, dirL, dirT, oW, oH }) {
    //psd中未旋转的中心点位置
    const [cX, cY] = [l + w / 2 - dirL, t + h / 2 - dirT]
    const [oL, oT] = [cX - oW / 2, cY - oH / 2]

    return {
      oL,
      oT,
      cX,
      cY
    }
  }

  //获取旋转之后的左上角和右下角的位置
  function getPos(imgData) {
    imgData.cols = imgData.width
    imgData.rows = imgData.height
    const { min, max } = Math
    let [minX, minY, maxX, maxY] = [imgData.width, imgData.height, -1, -1]
    for (let y = 0; y < imgData.rows; y++) {
      for (let x = 0; x < imgData.cols; x++) {
        if (getPixelByCoord(imgData, x, y)[3] != 0) {
          minX = min(minX, x)
          minY = min(minY, y)
          maxX = max(maxX, x)
          maxY = max(maxY, y)
        }
      }
    }
    return { minX, minY, maxX, maxY }
  }

  function getPixelByCoord({ data, cols }, coordX, coordY) {
    const num = parseInt(coordX * 4 + coordY * cols * 4)
    return [data[num], data[num + 1], data[num + 2], data[num + 3]]
  }
}

export function handleFigurePaths({ list, prop = 'path', type = 7 }) {
  return new Promise((resolve) => {
    if (!Array.isArray(list)) return resolve([])
    let p = []
    list.forEach((item, index) => {
      if (item instanceof File) {
        p.push(
          (async () => {
            let path = await getFigurePath(item, type)
            if (path) {
              list[index] = prop
                ? {
                  [prop]: path
                }
                : path
            }
            return index
          })()
        )
      }
    })
    // eslint-disable-next-line no-undef
    promiseAll(p).then((res) => {
      resolve(list)
    })
  })
}

export function getFigurePath(file, type = 7) {
  return new Promise((resolve) => {
    if (file instanceof File) {
      uploadOSSPics([
        {
          files: [file],
          prop: 'figurePath',
          dirPrefix: OSS_DIR_MAP_WITH_TYPE[type]
        }
      ])
        .then((res) => {
          resolve(res.figurePath)
        })
        .catch(() => {
          resolve(null)
        })
    } else {
      resolve(file)
    }
  })
}

//获取imageData中的Alpha通道的所有数据
export function getAlphaData(imageData) {
  const { width, height } = imageData
  const data = imageData.data
  const alphaData = {}

  alphaData.width = width
  alphaData.height = height
  alphaData.cols = width
  alphaData.rows = height
  alphaData.data = new Uint8Array(data.length / 4)
  let alphaDataIndex = 0
  for (let i = 0; i < data.length; i += 4) {
    alphaData.data[alphaDataIndex++] = data[i + 3]
  }
  return alphaData
}

// base64 转 file 对象
export const base64ToFile = (dataurl, filename) => {
  if (!isBase64(dataurl)) return dataurl
  let arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, {
    type: mime
  })
}

export function isBase64(str) {
  return str.indexOf('data:') !== -1 && str.indexOf('base64') !== -1
}

//压缩后图片的宽高 sW、sH，原图的宽高oW, oH
export function getScale({ sW, sH, oW, oH }) {
  const { min, max } = Math
  return min(max(sW, sH) / max(oW, oH), 1)
}


/**
 *
 * @param arr
 * @returns {Promise<core.FileTypeResult>}
 */
export async function getImageType(arr) {
  return await FileType.fromBuffer(arr)
}

//根据 Uint8Array 判断是否是png图片
export function isPng(array) {
  //png 开头8个字节的的标识符
  const pngStr = '89504E470D0A1A0A'
  let checkPngStr = ''
  ;[...array.slice(0, 8)].map((s) => (checkPngStr += s.toString(16).padStart(2, '0')))
  return checkPngStr.toLocaleUpperCase() === pngStr.toLocaleUpperCase()
}

//判断是cmyk还是rgb
// 1 Bytes | 颜色分量数，JFIF中使用 YCbCr 所以为固定值 3 （1：灰度图 3：YCbCr /rgb  4：CMYK）
export async function isCMYK(file) {
  if (file.type === 'image/png') {
    return false
  }
  const array = await file2Uint8Array(file)
  //png没有cmyk通道
  if (isPng(array)) {
    return false
  }

  const fIndexArr = []
  console.time('t2')
  array.map((item, index) => {
    const nextItem = array[index + 1]
    //标记名 SOFX => 0xFFCX
    //https://blog.csdn.net/ymlbright/article/details/44179891?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522163583372316780255232064%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=163583372316780255232064&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-4-44179891.pc_search_result_cache&utm_term=jpeg%E8%A7%A3%E7%A0%81&spm=1018.2226.3001.4187
    const ffcArr = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xc10, 0xca, 0xcb, 0xcd, 0xce, 0xcf]

    if (item == 0xff && ffcArr.includes(nextItem)) {
      const tmpArr = [...array.slice(index, index + 10)].map((s) => s.toString(16).padStart(2, '0'))
      fIndexArr.push(tmpArr)
      return true
    }
  })
  if (fIndexArr.length > 0) {
    const type = fIndexArr.slice(-1)[0].slice(-1)[0]
    console.timeEnd('t2')
    return type == '04'
  }
  console.timeEnd('t2')
  return false
}

//判断是图片通道 png 不存在cmyk通道, 第27位表示色彩类型
//colorType（色彩类型）PNG 图片一共有 5 种色彩类型，0 代表灰度颜色，2 代表用 RGB 表示颜色，即 (R, G, B)，3 代表用色板表示颜色，4 代表灰度和透明度来表示颜色，6 代表用 RGB 和透明度表示颜色，即 (R, G, B, A)。色板的色彩类型里，每个像素是由 1 个色彩通道表示的。
// 1 Bytes | 颜色分量数，JFIF中使用 YCbCr 所以为固定值 3 （1：灰度图 3：YCbCr /rgb  4：CMYK）
export async function checkColorType(file) {
  const array = file.length ? file : await file2Uint8Array(file)
  if (file.type === 'image/png' || !file.type && isPng(array)) {
    const colorType = array[25]
    if (colorType === 0 || colorType === 4) return 'gray'
    return false
  }
  const fIndexArr = []
  array.map((item, index) => {
    const nextItem = array[index + 1]
    //标记名 SOFX => 0xFFCX
    //https://blog.csdn.net/ymlbright/article/details/44179891?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522163583372316780255232064%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=163583372316780255232064&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-4-44179891.pc_search_result_cache&utm_term=jpeg%E8%A7%A3%E7%A0%81&spm=1018.2226.3001.4187
    const ffcArr = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xc10, 0xca, 0xcb, 0xcd, 0xce, 0xcf]
    if (item == 0xff && ffcArr.includes(nextItem)) {
      const tmpArr = [...array.slice(index, index + 10)].map((s) => s.toString(16).padStart(2, '0'))
      fIndexArr.push(tmpArr)
      return true
    }
  })
  if (!fIndexArr.length) return false
  const type = fIndexArr.slice(-1)[0].slice(-1)[0]
  if (type == '04') return 'CMYK'
  if (type === '01') return 'gray'
}

export async function checkColorTypeAndImageType(file) {
  const array = await file2Uint8Array(file)
  const typeRes = await analysisImageType(array)
  if (typeRes) return { type: typeRes }
  const cmykRes = await checkColorType(array)
  if (cmykRes) return { cmyk: cmykRes }
  return null

  async function analysisImageType(array) {
    const typeArr = ['image/png', 'image/jpg', 'image/jpeg']
    let imageInfo = await getImageType(array)
    if (!imageInfo) {
      imageInfo = {
        mime: `非${file.type}的文件的后缀`
      }
    }
    const includeType = typeArr.includes(imageInfo.mime)
    if (includeType) return
    if (file.type) {
      return `${file.name || ''}文件后缀异常，${imageInfo.mime}被修改为${file.type}`
    } else {
      return `上传文件异常，只能是 ${typeArr.join(',')} 格式!`
    }
    return false
  }
}

export function chunkRotateAfterSize({ left, top, angle = 0, width, height }) {
  const { min, max, abs } = Math
  const pos = getRectPosByAngle(
    {
      left: 0,
      top: 0,
      angle,
      width: width,
      height: height,
      scaleX: 1,
      scaleY: 1
    },
    angle,
    {
      x: 0,
      y: 0
    }
  )

  const boundingRect = pos.map((item) => {
    return {
      x: item.x,
      y: item.y
    }
  })

  const xMinPos = min(...boundingRect.map((p) => p.x))
  const xMaxPos = max(...boundingRect.map((p) => p.x))
  const yMinPos = min(...boundingRect.map((p) => p.y))
  const yMaxPos = max(...boundingRect.map((p) => p.y))

  const afterRotateWidth = abs(xMinPos) + abs(xMaxPos)
  const afterRotateHeight = abs(yMinPos) + abs(yMaxPos)

  // const topAfterRotatePoint = {
  //   left: xMinPos,
  //   top: yMinPos
  // }

  // const rightAfterRotatePoint = {
  //   left: xMinPos,
  //   top: yMaxPos
  // }

  // const bottomAfterRotatePoint = {
  //   left: xMaxPos,
  //   top: yMaxPos
  // }

  // const leftAfterRotatePoint = {
  //   left: xMinPos,
  //   top: yMaxPos
  // }
  // console.log('pos', pos)
  // console.log('pos11', [xMinPos, xMaxPos, yMinPos, yMaxPos])
  // console.log('pos22', [topAfterRotatePoint, rightAfterRotatePoint, bottomAfterRotatePoint, leftAfterRotatePoint])
  // console.log('afterRotateWidth', afterRotateWidth)
  // console.log('afterRotateHeight', afterRotateHeight)
  // console.log('xMinPos', xMinPos)
  // console.log('yMinPos', yMinPos)
  const [oL, oT] = [xMinPos + width / 2 + left, yMinPos + height / 2 + top]
  const [cX, cY] = [oL + afterRotateWidth / 2, oT + afterRotateHeight / 2]

  return {
    cX,
    cY,
    oL,
    oT
  }
}

//获取clip参数
export function getClipPos(rW, rH, cW, cH) {
  //兼容{rW, wH, cW, cH}的传参
  if (arguments.length === 1) {
    const option = rW
    rW = option.rW
    rH = option.rH
    cW = option.cW
    cH = option.cH
  }
  if (isUndefined(rW)) rW = cW
  if (isUndefined(rH)) rH = cH
  const l = (cW - rW) / 2
  const w = cW - l * 2
  const t = (cH - rH) / 2
  const h = cH - t * 2
  const r = l + w
  const b = t + h
  return {
    t,
    l,
    w,
    h,
    r,
    b
  }
}

//获取旋转之后的位置
export function getRectPosByAngle(activeObject, angle, originPoint) {
  originPoint = originPoint || activeObject.getCenterPoint()
  angle = angle || activeObject.angle || 0
  const posList = getRectPos(activeObject)
  return posList.map((pos) => {
    const degreesToRadiansAngle = fabric.util.degreesToRadians(angle)
    return fabric.util.rotatePoint(pos, originPoint, degreesToRadiansAngle)
  })
}

//获取当前选中图层的4个点的位置
export function getRectPos(activeObject) {
  // const { left, top, height, width } = activeObject.getBoundingRect(true)
  const { left: oL, top: oT, width: oW, height: oH, scaleX: oScaleX, scaleY: oScaleY, angle } = activeObject
  const left = oL - (oW * oScaleX) / 2
  const top = oT - (oH * oScaleY) / 2
  const right = left + oW * oScaleX
  const bottom = top + oH * oScaleY

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom }
  ]
}

export async function getOssPicInfo(src, needInfo = true) {
  if (needInfo) {
    src = `${src}?x-oss-process=image/info`
  }
  return await getSrcInfo(src)
}

export function getSrcWithoutPrefix(src) {
  return src?.match(/media.*$/)?.[0]
}

//判断路径是否是绝对路径
export function isAbsolutePath(path) {
  // 定义匹配绝对路径的正则表达式
  const absolutePathPattern = /^(?:\/|[a-z]+:\/\/)/i
  return absolutePathPattern.test(path)
}

// 获取图片主色调
export async function getOssPicAverageHue(src) {
  src = `${getAbsolutePath(src)}?x-oss-process=image/average-hue`
  return getSrcInfo(src).then(res => {
    const [err, data] = res
    if (err) return res
    const averageHue = Object.values(data)[0]
    if (averageHue) return [!averageHue, averageHue]
  }).catch(() => [true, null])
}

// 获取src 信息
export async function getSrcInfo(src) {
  try {
    const { status, data } = await axios.get(src)
    return [!$SUC({ code: status }), data]
  } catch {
    return [true, null]
  }
}

export function getAbsolutePath(src, host) {
  if(isAbsolutePath(src)) return src
  const ossHost = $GET($uploadOSSPics.ossInstance, 'ossUploadObj.host', '')
  if (ossHost) {
    src = `${host || ossHost}/${src}`
  }
  return src
}

//fabric旋转所有对象
export function rotateAllObjects({ canvas, angle, objects, rotateLeftCenter, rotateTopCenter }) {
  if (canvas && !objects) objects = canvas.getObjects()
  if (!objects) return
  if (!Array.isArray(objects)) objects = [objects]
  objects.map((o) => {
    const oPos = {
      x: o.left,
      y: o.top
    }
    const originPoint = {
      x: rotateLeftCenter,
      y: rotateTopCenter
    }
    const degreesToRadiansAngle = fabric.util.degreesToRadians(-angle)
    const rotatePos = fabric.util.rotatePoint(oPos, originPoint, degreesToRadiansAngle)
    o.setOptions({
      left: rotatePos.x,
      top: rotatePos.y,
      angle: o.angle + -angle
    })
  })
  canvas && canvas.renderAll()

  // const circle = new fabric.Circle({
  //   radius: 5000,
  //   left: rotateLeftCenter,
  //   top: rotateTopCenter,
  //   originX: 'center',
  //   originY: 'center'
  // })

  // const g = new fabric.Group([circle, ...objects], {
  //   angle: -angle,
  //   originX: 'center',
  //   originY: 'center'
  // })
  // if(canvas) {
  //   canvas.add(g)
  //   g.ungroupOnCanvas()
  //   canvas.remove(g)
  // }
  // canvas && canvas.renderAll()
}

export async function getExifTags(file) {
  try {
    return await exifr.parse(file, {
      xmp: true,
      mergeOutput: true,
      chunked: true,
      firstChunkSize: 512,
      firstChunkSizeNode: 512,
      firstChunkSizeBrowser: 65536, // 64kb
      chunkSize: 65536, // 64kb
      chunkLimit: 5,
      httpHeaders: {}
    })
  } catch (e) {
    return true
  }
}

/**
 * 校验图片是不是广域色值
 * @param file
 * @returns {Promise<boolean>}
 */
export async function validICCProfile(file) {
  const tags = await getExifTags(file)
  if (!tags) return true
  const value = $GET(tags, 'ICCProfile', null)
  if (!value) return true
  if (matchSRGB(value)) {
    return true
  }
  return false
  // const bool = /^Display\s*P3$/ig.test(value)
  // return !bool

  function matchSRGB(str) {
    const whiteReg = /^sRGB/ig
    if (!isString(str)) return true
    return whiteReg.test(str)
  }
}


export async function compressFile(file, options = {}) {
  //默认设置
  const defaultOptions = {
    maxWidth: COMPRESS_MAX_NUM,
    maxHeight: COMPRESS_MAX_NUM,
    convertSize: 'Infinity',
    checkOrientation: false,
    isValidICCProfile: true
  }
  const assignOptions = Object.assign({}, defaultOptions, options)

  return new Promise((resolve) => {
    new Compressor(file, {
      ...assignOptions,
      async success(result) {
        const { width: naturalWidth, height: naturalHeight } = this.image
        const isNeedFormatFile = await validICCProfile(file)
        if (!isNeedFormatFile && assignOptions.isValidICCProfile) {
          let canvas = document.createElement('canvas')
          canvas.width = naturalWidth
          canvas.height = naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(this.image, 0, 0, naturalWidth, naturalHeight)
          canvas.toBlob((rawFileResult) => {
            const rawFile = rawFileResult
            rawFile.uid = file.uid
            rawFile.lastModified = file.lastModified
            rawFile.lastModifiedDate = file.lastModifiedDate
            rawFile.name = file.name
            rawFile.webkitRelativePath = file.webkitRelativePath
            resolve({
              rawFile,
              file: result,
              name: result.name,
              naturalWidth,
              naturalHeight
            })
          }, file.type, 1)
        } else {
          resolve({
            rawFile: null,
            file: result,
            name: result.name,
            naturalWidth,
            naturalHeight
          })
        }
      },
      error(err) {
        resolve(null)
      }
    })
  })
}

/**
 * 获取oss上缩略图
 * @param url
 * @param longNum 压缩长边值
 * @param noUseCache 是否使用缓存图片
 * @param validALiCompress 是否开启缩略图缩略图压缩判断
 * @returns {string|Promise<string|*|undefined>} 开启缩略图压缩返回的是promise,其他情况返回处理过后的路径
 */
export function aLiCompressPicByUrl(url, longNum, noUseCache = false, validALiCompress = false) {
  if (!longNum && longNum !== false) {
    longNum = url
    url = ''
  }
  if (!url) {
    return `?x-oss-process=image/resize,l_${longNum}`
  }
  try {
    const urlInstance = new URL(url)
    if (!validALiCompress) {
      return createForMatUrl(urlInstance)
    }
    return getPassValidALiCompress(urlInstance)
  } catch {
    return url
  }

  function createForMatUrl(urlInstance) {
    const searchParams = urlInstance.searchParams
    if (longNum !== false && !searchParams.has('x-oss-process')) {
      searchParams.set('x-oss-process', `image/resize,l_${longNum}`)
    }
    if (noUseCache && !searchParams.has('uid')) {
      searchParams.set('uid', getUUID().replace(/-/g, ''))
    }
    return decodeURIComponent(urlInstance.href)
  }

  async function getPassValidALiCompress(urlInstance) {
    let formatUrl
    try {
      formatUrl = createForMatUrl(urlInstance)
      const success = await loadImage(formatUrl)
      if (success) return formatUrl
      throw new Error('image cross the border')
    } catch {
      return replaceOssProcess(formatUrl)
    }
  }

  function replaceOssProcess(formatUrl = url) {
    return formatUrl.replace('x-oss-process', 'x-oss-process-error')
  }

  function loadImage(rawUrl) {
    const img = new Image()
    return new Promise(resolve => {
      function sucFn() {
        offFn()
        resolve(true)
      }

      function errFn() {
        offFn()
        resolve(false)
      }

      function offFn() {
        img.removeEventListener('load', sucFn)
        img.removeEventListener('error', errFn)
      }

      img.addEventListener('load', sucFn)
      img.addEventListener('error', errFn)
      img.src = rawUrl
    })
  }
}

/**
 * 图片压缩失败补丁，电脑运行环境不佳，导致canvas会导致空白图片，发生这种情况，采用oss压缩
 * @param thumbnailFile
 * @param thumbnailPath
 * @param path
 * @returns {Promise<*>}
 */
export async function compressErrorPatch(thumbnailFile, thumbnailPath, path, dirPrefixType = 'designClipart') {
  //压缩失败Oss返回的主题色
  const compressErrorAverageHue = '0x000000'
  const fileSize = thumbnailFile.size
  //png压缩失败的图片区间 12000 ~ 14000 测试数据是 12908
  const maxPngCompressErrorFileSize = 14000
  const minPngCompressErrorFileSize = 12000

  //jpeg压缩失败的图片区间 3500 ~ 5500 测试数据是 4508
  const maxJpegCompressErrorFileSize = 5500
  const minJpegCompressErrorFileSize = 3500
  if (fileSize > maxPngCompressErrorFileSize) return thumbnailPath
  if (fileSize > maxJpegCompressErrorFileSize && fileSize < minPngCompressErrorFileSize) return thumbnailPath
  if (fileSize < minJpegCompressErrorFileSize) return thumbnailPath
  const [err, averageHue] = await getOssPicAverageHue(thumbnailPath)
  if (err) return thumbnailPath
  if (averageHue != compressErrorAverageHue) return thumbnailPath
  const ossThumbnailPath = `${getAbsolutePath(path)}?x-oss-process=image/resize,l_${COMPRESS_MAX_NUM}`
  const blob = await analysisFileByAxios(ossThumbnailPath, { passFileReader: true })
  if (!blob) return thumbnailPath
  const date = new Date()
  blob.lastModified = date.getTime()
  blob.lastModifiedDate = date
  blob.name = thumbnailFile.name
  const uploadedOssPicObj = await $uploadOSSPics([{
    files: [blob],
    prop: 'thumbnailPath',
    // eslint-disable-next-line no-undef
    dirPrefix: $ossDirMapWithType[dirPrefixType],
    uuidSuffix: '_t'
  }])
  if (!uploadedOssPicObj) return thumbnailPath
  return uploadedOssPicObj.thumbnailPath
}

// 获取字符串中匹配字符串之前的值
export function getAfterStr(str, matchStr) {
  const mediaIndex = str.indexOf(matchStr)
  if (mediaIndex < 0) return str
  return str.substr(mediaIndex)
}

export function calculateResizedDimensions(originWidth, originHeight) {
  // 确定最小边
  const minSide = Math.min(originWidth, originHeight)

  // 计算缩放比例
  const scale = 1920 / minSide

  // 计算新尺寸
  let newWidth, newHeight
  if (originWidth <= originHeight) {
    newWidth = 1920
    newHeight = Math.round(originHeight * scale)
  } else {
    newHeight = 1920
    newWidth = Math.round(originWidth * scale)
  }

  // 返回带px单位的结果
  return {
    width: `${newWidth}px`,
    height: `${newHeight}px`
  }
}
