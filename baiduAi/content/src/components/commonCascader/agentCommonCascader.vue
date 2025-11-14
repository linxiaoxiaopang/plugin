<template>
  <CommonCascader
    :options="options"
    :keyProps="keyProps"
    v-bind="$attrs"
    v-on="$listeners"
  ></CommonCascader>
</template>

<script>
import CommonCascader from '@/components/commonCascader'
import { isString } from 'lodash'

export default {
  components: {
    CommonCascader
  },

  props: {
    dicData: {
      type: [String, Array],
      default: () => []
    },

    showAll: {
      type: Boolean,
      default: true
    },

    concatOption: {
      type: Array,
      default: () => [{ label: '全部', value: 'all' }]
    },

    keyProps: {
      type: Object,
      default: () => ({
        value: 'value',
        label: 'label'
      })
    }
  },

  data() {
    return {
      data: []
    }
  },

  computed: {
    options({ data }) {
      if (!this.showAll) return this.data
      return this.concatOption.concat(data)
    }
  },

  created() {
    this.getDic()
  },

  methods: {
    async getDic() {
      if (!isString(this.dicData)) {
        this.data = this.dicData
        return
      }
      const res = await this.$store.dispatch('GetDic', this.dicData)
      this.data = res || []
    }
  }
}
</script>
