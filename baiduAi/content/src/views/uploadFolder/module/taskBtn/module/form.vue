<template>
  <BaseDialog
    v-if="taskDialog"
    top="10vh"
    width="1200px"
    title="任务列表"
    customClass="task-list-dialog"
    :hiddenFooter="true"
    :dialogVisible="taskDialog"
    @closed="onclose"
  >
    <div ref="body" class="body" v-infinite-scroll="load" infinite-scroll-distance="10">
      <baseButton class="mt10 mb10" type="primary" @click="download">
        下载已完成图片
      </baseButton>
      <div class="task-list--text mb20">
        <span>上传任务：<span class="text-primary">{{ data.length }}张</span></span>
        <span class="ml40">上传成功：<span class="text-primary">{{ succeeded.length }}张</span></span>
      </div>
      <CommonTable height="auto" :selection="false" :cols="cols" :infoData="data">
        <template #statusSlot="{ scoped: row }">
          <el-tag :type="row.status">
            {{ text(row) }}
          </el-tag>
          <div v-if="row.remark" class="text-striking mt10">失败原因：{{ row.remark }}</div>
        </template>

        <template #thumbnailPathSlot="{ scoped: row }">
          <div>
            <CacheImg
              v-if="row[row.prop]"
              style="width: 50px; height: 50px"
              fit="contain"
              :raw="row[row.prop]"
            ></CacheImg>
          </div>
          <el-button style="white-space: normal" type="text" size="mini">
            {{ row.title }}
          </el-button>
        </template>


        <template #categoryNameSlot="{ scoped: row }">
          {{ row[row.prop] || '默认' }}
        </template>

        <template #totalSlot="{ scoped: row }">
          <el-tag type="primary">
            {{ size(row) }}
          </el-tag>
        </template>


      </CommonTable>
    </div>
  </BaseDialog>
</template>
<script>
import CacheImg from '@/components/cacheImg.vue'

import { tasksCols as cols } from './cols'
import { UP_STATUS, DOWN_STATUS } from '@/utils/constant'

export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    taskDialog: {
      type: Boolean,
      default: false
    },
    sup_this: {
      type: Object,
      default: null
    }
  },

  components: {
    CacheImg
  },

  data() {
    return {
      count: 10,
      cols
    }
  },

  computed: {
    size() {
      return (row) => {
        const { total } = row || {}
        const M = 1 * 1024 * 1024
        const k = 1 * 1024
        if (!total || total === 0.000001) return '未知'
        if (total > M) {
          return Math.round(row.total / M) + 'M'
        }
        return Math.round(row.total / k) + 'K'
      }
    },
    succeeded({ data }) {
      return data.filter(item => item.status == 'success')
    }
  },

  methods: {
    text(row) {
      return {
        ready: '待处理',
        uploading: '处理中',
        failed: '失败',
        success: '成功'
      }[row.status]
    },
    load() {
      let { count } = this
      this.count = count + 10
      this.$nextTick(function () {
        this.$refs.body.scrollTop = count * 110 - 583
      })
    },
    onclose() {
      this.$emit('update:taskDialog', false)
    },
    download() {
      if (!chrome?.runtime) return
      chrome.runtime.sendMessage({ action: 'download', data: this.data.filter(item => item.resUrl) }, () => {
        this.$message.success('开始下载到本地，请稍后。')
      })
    }
  }
}
</script>
<style lang="scss" scoped>
::v-deep {
  .empty-component {
    padding-bottom: 100px !important;
  }
}

.task-list-dialog {
  .el-dialog__body {
    display: flex;
    flex-direction: column;
    height: calc(100% - 57px);
    padding-top: 0;
  }

  .dialog-body {
    overflow: hidden;
  }

  .body {
    max-height: calc(80vh - 75px);
    padding-bottom: 1px;
    overflow: hidden auto;
  }

  .task-list--text {
    height: 34px;
    line-height: 34px;
  }
}
</style>
