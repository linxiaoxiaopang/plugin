<template>
  <el-tooltip
    :content="contentHover"
    :disabled="isShowTooltip"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <div class='linkTo' @mouseover="onMouseOver(content)">
      <span :ref='content'>{{ content }}</span>
    </div>
  </el-tooltip>
</template>

<script>
export default {
  name: 'AvueCrudTooltip',
  props: {
    content: String
  },
  data() {
    return {
      isShowTooltip: false,
      contentHover: this.content
    }
  },
  watch: {},
  methods: {
    // 内容超出，显示文字提示内容
    onMouseOver(str) {
      // console.log(str)
      const tag = this.$refs[str]
      const parentWidth = tag.parentNode.offsetWidth // 获取元素父级可视宽度
      const contentWidth = tag.offsetWidth // 获取元素可视宽度
      this.isShowTooltip = contentWidth <= parentWidth
      // 鼠标悬停后显示的内容
      this.contentHover = this.content
    }
  }
}
</script>

<style lang="scss" scoped>
.linkTo {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
