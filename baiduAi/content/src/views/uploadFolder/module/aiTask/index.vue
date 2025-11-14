<template>
  <div v-drag class="upload-task">
    <div class="upload-task--ball" :class="{ wave: isUploading }"></div>

    <!-- show和after-enter解决：activeName为'failed'时，重新上传图片失败再次打开悬浮框，navBar位置不准确问题 -->
    <el-popover
      width="440"
      popper-class="upload-task--details"
      placement="left-start"
      trigger="click"
      @show="activeName === 'failed' && (activeName = '')"
      @after-enter="activeName === '' && (activeName = 'failed')"
    >
      <div slot="reference" class="upload-task--text">
        <template v-if="isUploading">
          <div class="text">图片上传中</div>
          <div class="text">已上传{{ succeeded.length }}张</div>
        </template>
        <template v-else>
          <div class="text">上传完成</div>
          <div class="text">共上传{{ succeeded.length }}张</div>
        </template>
        <div class="text failed">上传失败{{ failedLen }}张</div>
      </div>

      <el-tabs v-model="activeName">
        <el-tab-pane label="正在上传" name="uploading">
          <el-table height="370" :data="uploading">
            <el-table-column
              label="图片名称"
              prop="title"
              show-overflow-tooltip
              min-width="131"
            ></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="上传失败" name="failed">
          <el-table height="370" :data="[{ $isTotal: true }].concat(failed)" :span-method="spanMethod">
            <el-table-column
              label="图片名称"
              prop="title"
              show-overflow-tooltip
              width="164"
            >
              <template #default="{ row }">
                <template v-if="row.$isTotal">
                  <div>
                    <i class="el-icon-warning text-medium" style="vertical-align: middle"></i>
                    上传失败 {{ failedLen }} 张
                  </div>
                  <el-button v-if="isUploaded && failedLen" type="text" class="fr" @click="downloadFailed">下载excel文件
                  </el-button>
                </template>
                <template v-else>{{ row.title }}</template>
              </template>
            </el-table-column>
            <el-table-column
              label="上传失败原因"
              prop="remark"
              show-overflow-tooltip
            ></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <div class="upload-task--details--footer">
        <div>上传任务：<span class="text-primary">{{ uploadTasks.length }}张</span></div>
        <div>
          <el-button type="primary" size="small" class="ml10" @click="taskDialog = true">查看已完成</el-button>
        </div>
      </div>
    </el-popover>

    <TaskBtn :data="uploadTasks" :taskDialog.sync="taskDialog" />
  </div>
</template>

<script>
import { exportTableData } from '@/utils'
import TaskBtn from '../taskBtn'

export default {
  components: {
    TaskBtn
  },

  props: {
    uploadTasks: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      taskDialog: false,
      activeName: 'uploading'
    }
  },
  computed: {
    failed({ uploadTasks }) {
      return uploadTasks.filter(item => item.status == 'failed')
    },

    uploading({ uploadTasks }) {
      return uploadTasks.filter(item => item.status == 'uploading')
    },

    succeeded({ uploadTasks }) {
      return uploadTasks.filter(item => item.status == 'success')
    },

    isUploading() {
      return !!this.uploading.length
    },

    isUploaded() {
      return !this.isUploading
    },

    failedLen() {
      return this.failed.length
    }
  },
  methods: {
    downloadFailed() {
      exportTableData({
        filename: '图片上传失败',
        data: this.failed,
        column: [
          {
            label: '图片名称',
            prop: 'title'
          },
          {
            label: '上传失败原因',
            prop: 'remark'
          }
        ]
      })
    },
    spanMethod({ row, columnIndex }) {
      if (row.$isTotal) {
        return columnIndex === 0 ? [1, 2] : [0, 0]
      }
    }
  }
}
</script>

<style lang="scss">
$size: 109px;
.upload-task {
  position: fixed;
  top: 40%;
  right: 30px;
  z-index: 1000;
  width: $size + 10px;
  height: $size + 10px;
  overflow: hidden;
  border: 5px solid rgba(56, 65, 219, 0.2);
  border-radius: 50%;
}

.upload-task--text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  color: #b6c7ff;
  font-size: 12px;
  text-align: center;

  .text {
    &:nth-child(1) {
      margin-top: 25px;
    }

    &:nth-child(2) {
      margin-top: 14px;
    }

    &:nth-child(3) {
      margin-top: 8px;
    }

    &.failed {
      color: #EF8E23;
    }
  }
}

.upload-task--details {
  padding: 0;
  margin-top: 54px;

  &.el-popper[x-placement^=left] {
    margin-right: -5px;
  }

  .popper__arrow {
    display: none;
  }


  .el-tabs {
    .el-tabs__header {
      margin-bottom: 0;
    }

    .el-tabs__nav {
      margin-left: 20px;
    }

    .el-tabs__item {
      height: 50px;
      line-height: 50px;
    }

    .el-tabs__active-bar {
      width: 56px !important;
    }

    .el-tabs__nav-wrap::after {
      display: none;
    }
  }

  .el-table {
    th {
      height: 30px;
      padding: 0;
    }

    td {
      height: 34px;
      padding: 0;
      border-bottom: 0;
    }

    th, td {
      &:first-child {
        .cell {
          padding-left: 20px;
        }
      }
    }

    .cell.el-tooltip {
      white-space: nowrap;
      text-overflow: ellipsis !important;
    }
  }

  #pane-failed {
    .el-table__row {
      &:first-child {
        background-color: #FFF5E6;

        .cell {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100% !important;
        }

        .el-icon-warning {
          color: #F9921B;
        }

        .el-button {
          padding: 0;
        }
      }

      td:nth-child(2) {
        color: #F9921B;
      }
    }
  }

  .upload-task--details--footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    padding: 0 20px;
  }
}

.upload-task--ball {
  width: 116px;
  height: 116px;
  background-color: $color-primary;
  border-radius: 50%;
  position: relative;
}

.wave::before, .wave::after {
  content: "";
  width: $size * 2;
  height: $size * 2;
  position: absolute;
  top: -100%;
  left: -50%;
}

.wave::before {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 40%;
  animation: 10s rotate_before linear infinite;
}

.wave::after {
  background-color: rgba(255, 255, 255, 1);
  border-radius: 46%;
  animation: 10s rotate_after linear infinite;
}

@keyframes rotate_before {
  from {
    transform: translate(0%, 0%) rotate(0deg);
  }
  to {
    transform: translate(0%, -60%) rotate(360deg);
  }
}

@keyframes rotate_after {
  from {
    transform: translate(0%, 0%) rotate(0deg);
  }
  to {
    transform: translate(0%, -60%) rotate(30deg);
  }
}
</style>
