import { createRandomNum, parseImgSrc, aLiCompressPicByUrl } from '@/utils'
import { getImgDom } from '@/utils/utils/imageUtil'
import { isNumber } from '@/components/avue/utils/validate'

export const PICSIZE = {
  min: '?x-oss-process=image/resize,l_80,h_80',
  small: '?x-oss-process=image/resize,l_150,h_150',
  mid: '?x-oss-process=image/resize,l_350,h_350',
  large: '?x-oss-process=image/resize,l_750,h_750'
}
export const DESIGN_SHOW_LONG_NUM = 400

export const COMPRESS_MAX_LONG_STR = `?x-oss-process=image/resize,l_${DESIGN_SHOW_LONG_NUM},limit_0`

export const COMPRESS_ORIGIN_MAX_LONG_STR = `?x-oss-process=image/resize,l_${2000},limit_0`

export const KL_IMAGE_MAX_LONG_NUM = 1000

export const COMPRESS_KL_IMAGE_MAX_LONG_STR = `?x-oss-process=image/resize,l_${KL_IMAGE_MAX_LONG_NUM},limit_1`

export const PICBIGSIZE = 3 * 1024 * 1024

export const PIC_DISABLE = 1 //禁用
export const PIC_ENABLE = 0 //启用

// 成品主题风格背景图片类型 '2': 个人原创背景 3: AI图片 4: 超分
export const PERSONAL_ORIGINAL_BACKGROUND = '2'
export const AI_IMAGE = '3'
export const SUPER_RESOLUTION = '4'

//压缩图片最大宽度
export const COMPRESS_MAX_NUM = 800

//图片上传到oss的uuid和原本文件名称的分隔符
export const OSS_SEPARATOR = '@@@@@'

//temu平台使用不同的压缩语法
const syntaxList = [
  {
    name: 'kwcdn',
    check(src) {
      return src.indexOf('https://img.kwcdn.com/') == 0
    },
    formatUrl(src, size) {
      try {
        const urlInstance = new URL(src)
        const { origin, pathname } = urlInstance
        return `${origin}${pathname}?imageMogr2/thumbnail/${size}x${size}`
      } catch {
        return src
      }
    }
  }
]


export function getALiCompressUrl(src, size = 'min', noUseCache, validALiCompress = true) {
  // await new Promise(resolve => setTimeout(resolve, 1000))
  if (!src) return ''
  if (/^blob:/.test(src)) return src

  src = parseImgSrc(src) // 解决路径包含特殊字符的图片不显示问题
  const fItem = syntaxList.find(item => item.check(src))
  if (fItem) return fItem.formatUrl(src, size)
  if (!size) return aLiCompressPicByUrl(src, false, noUseCache)
  // size要在这之后判断：包含force__的size在这之后才会被取出正常size
  try {
    if (size.includes('force__')) {
      size = size.replace('force__', '')
      src = src
        .replace(/((x-oss-process=image)[^&]*&*)((uid=)[^&]*&*)?/g, '')
        .replace(/\?$/, '')
    }
  } catch {
  }
  if (size === 'origin') return aLiCompressPicByUrl(src, false, noUseCache)
  // size包含force__时，会去掉x-oss-process
  if (src.includes('x-oss-process')) return aLiCompressPicByUrl(src, false, noUseCache, validALiCompress)

  let picSize = PICSIZE[size]
  if (picSize) src = `${src}${src.includes('?') ? picSize.replace('?', '&') : picSize}`

  return aLiCompressPicByUrl(src, size, noUseCache, validALiCompress)
}

export async function getThumbnail(src, size = 'min', uid) {
  if (!src) return ''
  if (/^blob:/.test(src)) return src

  let picSize = isNumber(size) ? `?x-oss-process=image/resize,l_${size}` : PICSIZE[size]
  picSize = src.includes('?') ? picSize.replace('?', '&') : picSize
  let img = await getImgDom(`${src}${picSize}&uid=${uid || createRandomNum()}`)
  if (img) return img.src
}

export async function getThumbnailSrc(src, size, uid) {
  // await new Promise(resolve => setTimeout(resolve, 1000))
  if (!src) return ''
  if (/^blob:/.test(src)) return src

  src = parseImgSrc(src) // 解决路径包含特殊字符的图片不显示问题
  if (!size) return src

  try {
    if (size.includes('force__')) {
      size = size.replace('force__', '')
      src = src.replace(/((x-oss-process=image)[^&]*&*)((uid=)[^&]*&*)?/g, '').replace(/\?$/, '')
    }
  } catch (e) {
  }
  if (size === 'origin') return src
  if (src.includes('x-oss-process=')) return src
  let res = await getThumbnail(src, size, uid)
  return res || src
}
