<template>
  <appDialog
    btnType="primary"
    btnText="查看已完成"
    title="任务列表"
    customClass="task-list-dialog"
    top="10vh"
    :hasFooter="false"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <div class="task-list--text">
      <span>上传任务：<span class="text-primary">{{ uploadTasks.length }}张</span></span>
      <span class="ml40">上传任务：<span class="text-primary">{{ succeeded.length }}张</span></span>
    </div>
    <el-table border height="100%" :data="uploadTasks">
      <el-table-column
        label="状态"
        prop="status"
        min-width="131"
      ></el-table-column>
      <el-table-column
        label="文件大小"
        prop="size"
        min-width="88"
      ></el-table-column>
      <el-table-column
        label="分类"
        prop="type"
        min-width="131"
      ></el-table-column>
      <el-table-column
        label="图片"
        prop="imageFolderName"
        min-width="131"
      ></el-table-column>
      <el-table-column
        label="进度条"
        prop="imageFolderName"
        min-width="131"
      ></el-table-column>
    </el-table>
  </appDialog>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    succeeded: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    ...mapGetters(['uploadTasks'])
  }
}
</script>

<style lang="scss">
.task-list-dialog {
  height: 80vh;
  .el-dialog__body {
    display: flex;
    flex-direction: column;
    height: calc(100% - 57px);
    padding-top: 0;
  }
  .task-list--text {
    height: 34px;
    line-height: 34px;
  }
}
</style>