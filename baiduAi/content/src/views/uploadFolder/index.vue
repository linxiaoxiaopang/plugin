<template>
  <div v-move-to-dom="`.ai-edit-wraper .upload-btn`">
    <button @click="onclick" style="display: inline-block; height: 40px;" class="button-wrapper upload-btn">上传文件夹
    </button>
    <input ref="input" @change="onchange" type="file" id="folderInput" webkitdirectory style="display: none;"/>
  </div>
</template>

<script>
import LimitQueue from '@/utils/utils/limitQueue'
import { BaiduAi } from './utils/baiduAi'

export default {
  methods: {
    onclick() {
      this.$refs.input.click()
    },

  async  onchange(e) {
      const limitQueueInstance = new LimitQueue({ limit: 40 })
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
    }
  }
}

</script>

<style lang="scss" scoped>

</style>
