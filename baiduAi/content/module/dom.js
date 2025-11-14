export const dom = {
  uploadFolderBtn: null,
  uploadFileBtn: null,
  aiEditWrapper: null
}

function loadDom() {
  const aiEditWrapper = dom.aiEditWrapper = document.querySelector('.ai-edit-wraper')
  if (!dom.aiEditWrapper) {
    setTimeout(loadDom, 1000)
    return
  }
  const uploadFileBtn = dom.uploadFileBtn = aiEditWrapper.querySelector('.upload-btn')
  dom.uploadFolderBtn = createUploadFileBtn(uploadFileBtn)
}

async function createUploadFileBtn() {
  const uploadWrapper = document.createElement('div')
  uploadWrapper.innerHTML = `
     <button style="display: inline-block; height: 40px;" class="button-wrapper upload-btn">上传文件夹</button>
    <input type="file" id="folderInput" webkitdirectory style="display: none;" />
  `
  dom.uploadFileBtn.insertAdjacentElement('afterend', uploadWrapper)
  const btn = uploadWrapper.querySelector('.upload-btn')
  const { BaiduAi } = await import(chrome.runtime.getURL('./content/module/baiduAi.js'))
  const { LimitQueue } = await import(chrome.runtime.getURL('./content/utils/limitQueue.js'))
  btn.addEventListener('click', async () => {
    const limitQueueInstance = new LimitQueue({ limit: 40 })
    const folderInput = document.querySelector('#folderInput')
    folderInput.addEventListener(
      'change',
      async (e) => {
        const fileList = [...e.target.files]
        const pArr = fileList.map(async file => {
          const p1 = new Promise(resolve => {
            const fn = async () => {
              const instance = new BaiduAi({
                file
              })
              const res = await instance.action()
              console.log('res', res)
            }
            limitQueueInstance.concat(fn)
          })
          return p1
        })
        await Promise.all(pArr)
      },
      {
        once: true
      }
    )
    folderInput.click()
  })
  return uploadWrapper
}

loadDom()
