import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import { getURLData, getURLBase64, createRandomNum, getFileSuffix, getBinaryString, file2Base64 } from '@/utils'
import { Message } from 'element-ui'

export function downloadByPath(paths, name) {
  // eslint-disable-next-line no-undef
  thunderLink.newTask({
    downloadDir: '', // 指定当前任务的下载目录，迅雷会在用户剩余空间最大的磁盘根目录中创建这个目录。若不填此项，会下载到用户默认下载目录
    tasks: paths.map((path, index) => {
      if (Array.isArray(name)) {
        return {
          name: name[index],
          url: path
        }
      }
      return {
        name,
        url: path
      }
    })
  })
}

export function initCallBack() {
  this.$nextTick(() => {
    // eslint-disable-next-line no-undef
    thunderLink()
  })
}

export async function downloadByZip(paths, folderName) {
  if (!(Array.isArray(paths) && paths.length)) return
  if (!folderName) {
    folderName = createFolderPic()
  }
  var zip = new JSZip()
  var folder = zip.folder(folderName)
  const imgLoadedErr = []
  const p = paths.map(async (image, index) => {
    const imgUrl = image.url
    const name = image.name
    image.status = '1'
    return await getURLData(imgUrl + '?uid=' + createRandomNum()).then((img) => {
      //下载失败
      if (!img) {
        imgLoadedErr.push(name || fileName)
        image.status = '4'
        return
      }

      let urlBase64 = img.target.result
      const file = imgUrl.split('/')
      const fileName = file[file.length - 1]
      const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1)
      // console.log(img)
      let props = ['loaded', 'total']
      props.forEach(prop => {
        image[prop] = img[prop]
      })
      image.thumbnailPath = img.data
      image.status = '3'
      //以data:text/html开头的Base64下载的是pdf
      folder.file(
        `${name}.${fileExtension}`,
        urlBase64.replace(/^data:(image|text|application)\/(png|jpg|jpeg|html|pdf);base64,/, ''),
        {
          base64: true
        }
      )
    })
  })
  await Promise.all(p)
  // Message.success('下载完成，正在压缩...')
  // eslint-disable-next-line no-undef
  let content = await awaitFormResolve(zip.generateAsync({ type: 'blob' }))
  if (imgLoadedErr.length == paths.length) {
    Message.error(`${imgLoadedErr.join('、')}文件下载失败`)
    return
  }
  if (content) {
    // see FileSaver.js
    saveAs(content, folderName)
    if (imgLoadedErr.length) {
      // Message.success(`下载完成, 其中${imgLoadedErr.join(',')}下载失败`)
      Message({
        type: 'success',
        dangerouslyUseHTMLString: true,
        message: `下载完成, <span style="color: red;">${imgLoadedErr.join('、')}等文件下载失败</span>`,
        duration: 10000,
        showClose: true
      })
    } else {
      Message.success('下载成功')
    }
  } else {
    Message.warning('下载失败')
  }
}

//产生随机图片名称
export function createFolderPic() {
  var now = new Date()
  var year = now.getFullYear() //得到年份
  var month = now.getMonth() //得到月份
  var date = now.getDate() //得到日期
  var hour = now.getHours() //得到小时
  var minu = now.getMinutes() //得到分钟
  month = month + 1
  if (month < 10) month = '0' + month
  if (date < 10) date = '0' + date
  var number = now.getSeconds() % 43 //这将产生一个基于目前时间的0到42的整数。
  var time = year + month + date + hour + minu
  return time + '_' + number
}

export function downloadImage(src, name) {
  if (name === undefined) {
    let tempArr = src.split('/')
    name = tempArr[tempArr.length - 1].split('.')[0]
  }
  // 创建一个img标签
  var image = new Image()
  // 解决跨域 Canvas 污染问题
  image.setAttribute('crossOrigin', 'anonymous')
  image.onload = function () {
    var canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    var context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, image.width, image.height)
    var url = canvas.toDataURL('image/jpeg', 1.0)
    // 生成一个a元素
    var a = document.createElement('a')
    // 创建一个单击事件
    var event = new MouseEvent('click')
    // 将a的download属性设置为我们想要下载的图片名称，若name不存在则使用‘下载图片名称’作为默认名称
    a.download = name // one是默认的名称
    // 将生成的URL设置为a.href属性
    a.href = url
    // 触发a的单击事件
    a.dispatchEvent(event)
  }
  image.src = src
}

export async function downloadFile(file, name, suffix) {
  if (file instanceof Blob) {
    file = await file2Base64(file)
  } else {
    if (name === undefined) {
      let tempArr = file.split('/')
      name = tempArr[tempArr.length - 1].split('.')[0]
    }
    if (suffix === undefined) suffix = getFileSuffix(file)
    file = await getURLBase64(file)
    if (!file) {
      Message.warning('下载失败')
      return
    }
  }

  // 生成一个a元素
  var a = document.createElement('a')
  // 创建一个单击事件
  var event = new MouseEvent('click')
  // 将a的download属性设置为我们想要下载的图片名称，若name不存在则使用‘下载图片名称’作为默认名称
  a.download = name + '.' + suffix // one是默认的名称
  // 将生成的URL设置为a.href属性
  a.href = file
  // 触发a的单击事件
  a.dispatchEvent(event)
  return true
}

export async function downloadFileByTagA(url, name) {
  // 生成一个a元素
  var a = document.createElement('a')
  // 创建一个单击事件
  var event = new MouseEvent('click')
  // 将a的download属性设置为我们想要下载的图片名称，若name不存在则使用‘下载图片名称’作为默认名称
  a.download = name // one是默认的名称
  // 将生成的URL设置为a.href属性
  a.href = url
  // 触发a的单击事件
  a.dispatchEvent(event)
  return true
}

/**
 * @description: 根据dom下载pdf
 * @param {*} dom
 * @param {*} name
 * @return {*}
 */

export async function downPdfByJsPDF(dom, name) {
  try {
    const doc = await getJsPdfDoc(dom, name)
    doc.save(name)
    Message.success('下载成功')
  } catch { }
}

/**
 * @description: 根据dom获取pdf
 * @param {*} dom
 * @param {*} name
 * @return {*}
 */
export async function getPdfUrlByDom(dom, name) {
  try {
    const doc = await getJsPdfDoc(dom, name)
    const bloburl = doc.output('bloburl')
    return bloburl
  } catch { }
}

/**
 * @description: 根据dom获取pdf
 * @param {*} dom
 * @param {*} name
 * @return {*}
 */
export async function getPdfBase64ByDom(dom, name, option = {}) {
  try {
    const doc = await getJsPdfDoc(dom, name, option)
    const base64Url = doc.output('dataurlstring', getUUID())
    return base64Url
  } catch (err) {
    console.log('err', err)
  }
}


/**
 * @description: 创建一个jspdf实例
 * @param {*} dom
 * @param {*} name
 * @return {*}
 */
async function getJsPdfDoc(dom, name) {
  if (!dom) {
    throw Error('请输入dom元素')
  }
  if (!name) {
    throw Error('请输入名称')
  }
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4' //a4纸张尺寸
  })
  const myFont = await getFontBinaryString('/fonts/simhei.ttf')
  if (myFont) {
    doc.addFileToVFS('simhei.ttf', myFont)
    doc.addFont('simhei.ttf', 'simhei', 'normal')
    doc.setFont('simhei')
  }
  const w = Math.max(dom.clientWidth, dom.scrollWidth, dom.offsetWidth)
  // const h = Math.max(dom.clientHeight, dom.scrollHeight, dom.offsetHeight)
  const wPt = 595.28 //打印宽度pt为 595.28

  //一页pdf显示html页面生成的canvas高度;
  //未生成pdf的html页面高度

  return await new Promise((resolve, reject) => {
    try {
      doc.html(dom, {
        html2canvas: {
          allowTaint: true,
          useCORS: true,
          imageTimeout: 0,
          scale: wPt / w
        },
        callback: (doc) => {
          const pageTotal = doc.internal.getNumberOfPages()
          //删除最后的空白页面
          doc.deletePage(pageTotal)
          resolve(doc)
        }
      })
    } catch (err) {
      console.log(err)
      Message.error('下载失败')
      reject(err)
    }
  })
}

export async function downloadImageByAixos(src, name) {
  if (name === undefined) {
    let tempArr = src.split('/')
    name = tempArr[tempArr.length - 1].split('.')[0]
  }
  const suffix = getFileSuffix(src)
  const url = await getURLBase64(src)
  if (!url) return Message.warning('下载失败')

  // 生成一个a元素
  var a = document.createElement('a')
  // 创建一个单击事件
  var event = new MouseEvent('click')
  // 将a的download属性设置为我们想要下载的图片名称，若name不存在则使用‘下载图片名称’作为默认名称
  a.download = name + '.' + suffix // one是默认的名称
  // 将生成的URL设置为a.href属性
  a.href = url
  // 触发a的单击事件
  a.dispatchEvent(event)
  return true
}

const getFontBinaryString = (function() {
  let fontBlob = null
  return async function() {
    if (fontBlob) return fontBlob
    fontBlob = await getBinaryString('/fonts/simhei.ttf')
    if (!fontBlob) {
      Message.error('获取字体失败, 刷新后重试。')
    }
    return fontBlob
  }
}())
