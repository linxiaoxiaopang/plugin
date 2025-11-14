<template>
  <AgentCommonCascader
    dicData="fontStyleCategory"
    :concatOption="concatOption"
    v-bind="$attrs"
    v-on="$listeners" />
</template>

<script>
import AgentCommonCascader from './agentCommonCascader'

export default {
  data() {
    return {
      concatOption: [
        { label: '常用', value: 'used' },
        { label: '全部', value: 'all' }
      ]
    }
  },

  components: {
    AgentCommonCascader
  }
}

</script>

<style lang="scss" scoped>

</style>
