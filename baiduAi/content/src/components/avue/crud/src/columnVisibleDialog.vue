<template>
  <el-popover
    ref="columnVisibleDialog"
    placement="bottom"
    title="列配置"
    trigger="click"
    :visible-arrow="false"
    popper-class="column-visible-dialog"
  >
    <span style="display: inline-block;" slot="reference" @click="columnVisibleDialogOpen">
      <slot name="columnBtn">
        <el-button icon="el-icon-s-operation" circle></el-button>
      </slot>
    </span>
    
    <el-checkbox-group v-model="nShowColumnList">
      <draggable :list="nColumnSortList" handle=".handle" :move="columnVisibleMove">
        <el-checkbox
          v-for="(column, index) in nColumnSortList"
          :key="column.prop"
          :label="column.prop"
          class="mr0"
        >
          <div class="icon-text-wrapper">
            <svg-icon
              :icon-class="changeData[column.prop].$isTop ? 'tuding-full' : 'tuding'"
              class-name="text-primary icon"
              :class="{ 'tuding-full': changeData[column.prop].$isTop }"
              @click.prevent.native="columnVisibleToTop(column, index)"
            ></svg-icon>
            <span class="text">{{ column.label }}</span>
          </div>
          <svg-icon icon-class="menu" class-name="handle" @click.prevent.native=""></svg-icon>
        </el-checkbox>
      </draggable>
    </el-checkbox-group>
  
    <div class="dialog-footer">
      <Popover
        class="fl"
        popperClass="popper-delete"
        width="172"
        @sureHandler="reset"
      >
        <template #tip>
          <div class="mb10">是否恢复默认</div>
        </template>
        <template #reference="{ popoverLoading }">
          <el-button size="small" type="text" :loading="popoverLoading">恢复默认</el-button>
        </template>
      </Popover>
      <el-button class="text-small" @click="columnVisibleDialogClose">取消</el-button>
      <el-button class="text-small" type="primary" @click="columnVisibleDialogSave">保存</el-button>
    </div>
  </el-popover>
</template>

<script>
// import draggable from 'vuedraggable'
import { changeIndex, keyAssign, getAddAndDelList } from '@/components/avue/utils/util'

export default {
  components: {
    // draggable
  },
  props: {
    columnList: {
      default: () => []
    }
  },
  data() {
    return {
      // 表格列显隐
      columnVisible: false,
      changeData: {},
      columnSortList: [],
      nColumnSortList: null,
      showColumnList: [],
      nShowColumnList: []
    }
  },
  watch: {
    columnList: {
      handler(n) {
        let { columnSortList } = this
        n.forEach((column, index) => {
          if (column.$oSort === undefined) column.$oSort = index
          if (column.$sort === undefined) this.$set(column, '$sort', index)
          if (column.fixed === 'left') this.$set(column, '$isTop', true)
        })
        
        let {
          addList,
          delList
        } = getAddAndDelList(n, columnSortList, 'prop')
  
        this.columnSortList = n.sort((a, b) => a.$sort - b.$sort)
  
        this.showColumnList = this.showColumnList.concat(addList).filter(prop => !delList.includes(prop))
        
        // console.log(n, this.columnSortList)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    columnVisibleToTop(column, index) {
      let { nColumnSortList, changeData } = this
      let isTopCount = 0
      nColumnSortList.forEach((column) => {
        if (changeData[column.prop].$isTop) isTopCount++
      })
      let isTop = changeData[column.prop].$isTop
      if (isTop || isTopCount < 6) {
        this.$set(changeData[column.prop], '$isTop', !isTop)
        // console.log(isTop, index, isTopCount)
        changeIndex(nColumnSortList, index, isTop ? --isTopCount : isTopCount)
      } else {
        this.$message.warning('最多设置6个置顶')
      }
    },
    columnVisibleDialogOpen() {
      this.columnVisible = true
      this.nShowColumnList = this.columnSortList
        .filter(column => column.$checked !== false)
        .map(column => column.prop)
      
      let tempObj = {}
      this.nColumnSortList = this.columnSortList.map(column => {
        tempObj[column.prop] = {
          ...column
        }
        return column
      })
      this.changeData = tempObj
    },
    columnVisibleDialogSave() {
      this.columnVisibleDialogClose()
      let { nColumnSortList, nShowColumnList, changeData } = this
      this.columnSortList = nColumnSortList.map((column, index) => {
        keyAssign(column, changeData[column.prop], '$isTop')
        this.$set(column, 'fixed', changeData[column.prop].$isTop ? 'left' : undefined)
        column.$sort = index
        return column
      })
      this.showColumnList = nShowColumnList
      this.$emit(
        'submit',
        nColumnSortList.filter((column, index) => {
          column.$sort = index
          column.$checked = nShowColumnList.includes(column.prop)
          return column.$checked
        })
      )
    },
    columnVisibleDialogClose() {
      this.$nextTick(function () {
        this.$refs.columnVisibleDialog.doClose()
      })
    },
    columnVisibleMove({ relatedContext, draggedContext }) {
      let { changeData } = this
      const relatedElement = relatedContext.element
      const draggedElement = draggedContext.element
      if (changeData[draggedElement.prop].$isTop) {
        // 固定列只能在固定列中排序
        return !!changeData[relatedElement.prop].$isTop
      } else {
        // 不固定列只能在不固定列中排序
        return !changeData[relatedElement.prop].$isTop
      }
    },
  
    reset() {
      let { changeData } = this
      let showColumnList = []
      this.nColumnSortList = this.nColumnSortList
        .map(column => {
          changeData[column.prop].$isTop = undefined
          showColumnList.push(column.prop)
          return column
        })
        .sort((a, b) => a.$oSort - b.$oSort)
  
      this.nShowColumnList = showColumnList
  
      // console.log(this.nColumnSortList)
    }
  }
};
</script>

<style lang="scss">
.column-visible-dialog {
  .el-checkbox-group {
    height: 300px;
    overflow: hidden auto;
  }
  .el-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  .el-checkbox__label {
    flex: 1;
    padding-left: 0;
    padding-right: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
  }
  .tuding-full.svg-icon {
    left: 14px;
    font-size: 2em;
  }
  .dialog-footer {
    margin-top: 8px;
    text-align: right;
    .el-button {
      margin-right: 0;
    }
  }
}
</style>
