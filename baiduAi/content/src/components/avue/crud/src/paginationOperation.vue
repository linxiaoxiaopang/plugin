<template functional>
  <div
    class="pagination-operation"
    v-bind="data.attrs"
  >
    <div class="operation-left">
      <slot name="left"></slot>
    </div>
    <div class="operation-right">
      <slot name="right"></slot>
      <div class="pagination">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaginationOperation'
}
</script>

<style lang="scss" scoped>
$gutter: 16px;
$button-height: 32px;
$pagination-height: 28px;
$pagination-top: ($button-height - $pagination-height) / 2;
.pagination-operation {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  .operation-left {
    line-height: $button-height;
  }
  .operation-right {
    flex: 1;
    padding-left: 16px;
    line-height: $button-height;
    text-align: right;
  }
  .pagination {
    width: 100%;
  }

  ::v-deep {
    > .operation-left,
    > .operation-right {
      > .pagination {
        > * {
          margin-bottom: $gutter;

          &.el-pagination {
            height: $button-height;
            padding: $pagination-top 0;
            margin-bottom: $gutter - $pagination-top;
          }
        }
      }
      > *:not(.pagination) {
        margin-bottom: $gutter;

        + * {
          margin-left: $gutter;
        }
      }
    }

    .el-pagination.el-pagination {
      padding-top: 0;
      padding-bottom: 0;
    }
  }
}
.w100 {
  width: 100%;
}
.flex-center-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>