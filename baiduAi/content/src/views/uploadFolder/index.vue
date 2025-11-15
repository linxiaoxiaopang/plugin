<template>
  <div class="upload-folder-component" v-move-to-dom="`.ai-edit-wraper .upload-btn`">
    <button @click="onclick" class="button-wrapper upload-btn">
      <div class="upload-icon">
        <img src="https://psstatic.cdn.bcebos.com/basics/image_fe/upload_1713244752000.png">
      </div>
      <div class="lg"> 上传文件夹</div>
    </button>
    <input ref="input" :key="key" @change="onchange" type="file" id="folderInput" webkitdirectory
           style="display: none;"/>
    <AiTask :uploadTasks="data"/>
  </div>
</template>

<script>
import AiTask from './module/aiTask'
import LimitQueue from '@/utils/utils/limitQueue'
import { BaiduAi } from './utils/baiduAi'
import { option } from './const'
import { getUUID } from '@/utils'

export default {
  components: {
    AiTask
  },

  data() {
    return {
      option,
      visible: false,
      key: getUUID(),
      limitQueueInstance: new LimitQueue({ limit: 40 }),
      data: []
    }
  },

  methods: {
    onclick() {
      this.$refs.input.click()
    },

    async onchange(e) {
      const limitQueueInstance = this.limitQueueInstance
      const fileList = [...e.target.files]
      const instanceList = fileList.map(file => new BaiduAi({ file }))
      this.data.push(...instanceList)
      const pArr = instanceList.map(async instance => {
        const p1 = new Promise(resolve => {
          const fn = async () => {
            const res = await instance.action()
            resolve(res)
          }
          limitQueueInstance.concat(fn)
        })
        return p1
      })
      this.visible = true
      this.key = getUUID()
      await Promise.all(pArr)
      const finished = this.data.every(item => item.finished)
      if (!finished) return
      if (chrome?.runtime) {
        chrome.runtime.sendMessage({ action: 'download', data: instanceList.filter(item => item.resUrl) }, () => {
          this.$message.success('生成完毕，开始下载到本地。')
        })
      }
    }
  },

  destroyed() {
    this.data.map(item => {
      URL.revokeObjectURL(item.url)
    })
  }
}

</script>

<style lang="scss" scoped>

</style>
