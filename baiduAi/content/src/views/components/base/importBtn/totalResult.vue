<template>
  <div class="count-wrapper flex-middle mb10">
    <div class="flex-one">导入总条数：{{ total }}</div>
    <div class="flex-one">可导入成功：{{ successNum }}</div>
    <div class="flex-one">导入失败：{{ failureNum }}</div>
  </div>
</template>

<script>

export default {
  props: {
    data: {
      type: Array,
      required: true
    },

    errData: {
      type: Array,
      required: true
    }
  },

  computed: {
    total({ data }) {
      return data.length
    },

    failureNum({ errData }) {
      return errData.length
    },

    successNum({ total, failureNum }) {
      return total - failureNum
    }
  }
}

</script>

<style lang="scss" scoped>
.count-wrapper {
  width: 600px;
}
</style>
