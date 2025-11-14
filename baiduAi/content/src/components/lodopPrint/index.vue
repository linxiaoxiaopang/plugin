<template>
  <div class="lodop-print_component mb20" v-scrollFocus="isFocus">
    <div class="scan_wrapper" v-if="showScaninput">
      <scannerInput
        ref="input"
        clearable
        class="scan-input hook-scorll-focus input"
        :placeholder="$attrs.placeholder || '请扫描'"
        :size="$attrs.size || 'small'"
        @input="inputHandler"
        @keyup.enter.native="toQuery"
        @clear="$emit('clear')"
        v-bind="$attrs"
        v-on="$listeners"
      ></scannerInput>
      <span v-if="commitBtn" class="ml20">
        <slot :toQuery="toQuery">
          <el-button v-bind="btnAttrs" uiid="zd-lodopPrint-btn" @click="toQuery">{{ commitTxt }}</el-button>
        </slot>
      </span>
    </div>
  </div>
</template>

<script>
import ScannerInput from '@/components/scannerInput'

export default {
  components: {
    ScannerInput
  },

  props: {
    //锁定焦点
    isFocus: {
      type: Boolean,
      default: true
    },
    clearOnQuery: {
      type: Boolean,
      default: true
    },
    
    //展示扫描框
    showScaninput: {
      type: Boolean,
      default: true
    },

    //btn 属性
    btnProps: {
      type: Object,
      default: () => ({})
    },

    commitBtn: {
      type: Boolean,
      default: true
    },
    commitTxt: {
      type: String,
      default: '确定'
    }
  },

  computed: {
    btnAttrs({ btnProps }) {
      return {
        type: 'primary',
        size: 'small',
        ...btnProps
      }
    }
  },

  methods: {
    inputHandler(val) {
      this.$nextTick(() => {
        //清除两边空格
        this.$emit('input', val.trim())
      })
    },

    async toQuery() {
      const { value } = this.$attrs
      if (!value) return this.$message.error('扫描数据不能为空')
      //扫描事件
      if (value) this.$emit('scanHandler', this.$attrs.value)
      this.$nextTick(() => {
        this.clearOnQuery && this.$emit('input', '')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.lodop-print_component {
  text-align: left;
}
.scan_wrapper {
  display: flex;
  justify-content: space-between;
  .scan-input {
    flex: 1;
  }
}
</style>