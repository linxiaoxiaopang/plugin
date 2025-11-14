<template>
  <Popover :placement="$attrs.placement" @sureHandler="handleDisabled">
    <template #tip>
      <slot name="tip">
        <p>确定{{ disabledBtnStatus.text }}？</p>
      </slot>
    </template>
    <template #reference="{ scope: loading }">
      <color-text-btn
        :type="disabledBtnStatus.type"
        class="filter-item"
        :loading="loading"
      >
        {{ disabledBtnStatus.text }}
      </color-text-btn>
    </template>
  </Popover>
</template>
<script>
import request from '@/service/request'
import { getXMenuType } from '@/utils/constant'

let urls = {}
export default {
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    disabledProp: {
      type: String,
      default: 'isDisabled'
    },
    disabledValue: {
      type: Boolean|Number,
      default: 0
    },
    activeValue: {
      type: Boolean|Number,
      default: 1
    },
    disabledText: {
      type: String,
      default: '解冻'
    },
    disabledType: {
      type: String,
      default: 'text'
    },
    activeText: {
      type: String,
      default: '冻结'
    },
    activeType: {
      type: String,
      default: 'danger'
    },
    afterSubmit: Function,
    type: {
      type: String,
      default: 'user'
    },
    api: {
      type: Function
    },
    postData: Object,
    method: {
      type: String,
      default: 'post'
    }
  },
  data() {
    return {
    
    }
  },
  computed: {
    value({ data, disabledProp }) {
      return data[disabledProp]
    },
    isDisabled({ value, disabledValue }) {
      return value === disabledValue
    },
    isDeleteApi({ type }) {
      return /delete/i.test(type)
    },
    // 改变后的值
    changedValue({ isDisabled, disabledValue, activeValue }) {
      return isDisabled ? activeValue : disabledValue
    },
    disabledBtnStatus({ isDisabled, disabledText, disabledType, activeText, activeType }) {
      if (isDisabled) return {
        text: disabledText,
        type: disabledType
      }
      return {
        text: activeText,
        type: activeType
      }
    },
    curApi() {
      let {
        api,
        postData,
        method,
        type,
        isDeleteApi,
        data,
        disabledProp,
        changedValue
      } = this
      if (typeof api === 'function') return api
      let params = isDeleteApi ? {} : { [disabledProp]: changedValue }
      let option
      if (method === 'post') {
        option = {
          url: urls[type],
          method,
          data: postData ? postData : {
            id: data.id,
            ...params
          }
        }
      } else {
        option = {
          url: urls[type] + data.id,
          method,
          data: postData ? postData : params
        }
      }
      return () => {
        return request(
          Object.assign(
            option,
            {
              headers: getXMenuType('btn')
            }
          )
        )
      }
    }
  },
  methods: {
    async handleDisabled() {
      let res = await awaitResolve(this.curApi())
      if (res) {
        this.$message.success(`${this.disabledBtnStatus.text}成功`)
        this.handleSuccess()
      }
      if (typeof this.afterSubmit === 'function') await this.afterSubmit(res)
    },
    handleSuccess() {
      if (typeof this.success === 'function') {
        if (this.success()) return
      }
      this.$set(this.data, this.disabledProp, this.changedValue)
    }
  }
};
</script>
