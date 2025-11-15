<template>
  <div class="upload-folder-component" v-move-to-dom="`.ai-edit-wraper .upload-btn`">
    <button @click="onclick" class="button-wrapper upload-btn">
      <avue-crud-select @click.native.stop :clearable="false" v-model="concurrency" class="concurrency"
                        style="width: 60px;position: relative;left: -30px;" :dic="dic"/>
      <el-checkbox @click.native.stop v-model="useOss" class="ml05" style="position: relative;left: -10px;">
        <span style="color: #fff;">oss</span>
      </el-checkbox>
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
    const dic = new Array(20).fill(1).map((item, index) => {
      return {
        label: index + 1,
        value: index + 1
      }
    })
    return {
      option,
      dic,
      concurrency: 20,
      visible: false,
      useOss: true,
      key: getUUID(),
      limitQueueInstance: new LimitQueue({ limit: 5 }),
      data: []
    }
  },

  watch: {
    concurrency(newVal) {
      this.limitQueueInstance.setLimit(newVal || 5)
    }
  },

  mounted() {
    const uploadTips = document.querySelector('.upload-tips-1')
    if(!uploadTips) return
    uploadTips.textContent = '文件夹一次推荐小于40张图片，开启20个线程。支持拖拽、Ctrl+V， '
    uploadTips.style.fontSize = '30px'
  },

  methods: {
    onclick() {
      this.$refs.input.click()
    },

    async onchange(e) {
      const limitQueueInstance = this.limitQueueInstance
      const fileList = [...e.target.files]
      const instanceList = fileList.map(file => new BaiduAi({ file, useOss: this.useOss }))
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
  }

  // destroyed() {
  //   this.data.map(item => {
  //     URL.revokeObjectURL(item.url)
  //   })
  // }
}

</script>

<style lang="scss" scoped>
.concurrency {
  ::v-deep {
    .el-input__inner {
      width: 70px;
      background: transparent;
      border: none;
      color: #fff;
    }
  }
}

</style>
