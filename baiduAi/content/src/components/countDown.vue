<template>
  <el-button class="get-code-component" type="default" @click.prevent="getCode" :disabled="isdisabled" v-bind="$attrs">{{
    codeText
  }}</el-button>
</template>

<script>
const TIME_MAX_NUM = 60

export default {
  props: {
    //获取验证码接口
    getCodeFunc: {
      tyep: Function,
      require: true
    },

    checkFunc: {
      tyep: Function
    }
  },

  data() {
    return {
      isdisabled: false,
      codeText: '获取验证码'
    }
  },

  methods: {
    getCode() {
      this.setTime()
    },

    async setTime() {
      if (this.checkFunc) {
        const isNext = await this.checkFunc()
        //校验是否通过
        this.$emit('checkCode', isNext)
        if (!isNext) {
          return
        }
      }

      this.isdisabled = true
      let time = TIME_MAX_NUM
      let i = 0

      let timerFunc = () => {
        if (i == 0) {
          this.getVerificationCode()
        }
        i++
        if (i <= TIME_MAX_NUM) {
          this.codeText = (--time + '').padStart(2, 0) + '秒'
        } else {
          this.codeText = '获取验证码'
        }
      }

      let timerOutFunc = () => {
        timerFunc()
        if (i <= TIME_MAX_NUM) {
          setTimeout(() => {
            timerOutFunc()
          }, 1000)
        } else {
          this.isdisabled = false
        }
      }
      timerOutFunc()
    },

    // 获取验证码
    async getVerificationCode() {
      try {
        const { code, detail } = await this.getCodeFunc()
        if ($SUC({ code })) {
          this.$emit('getCode', detail || true)
        } else {
          this.$emit('getCode', false)
        }
      } catch {
        this.$emit('getCode', false)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.get-code-component {
  //width: 80px;
  padding-left: 0px;
  padding-right: 0px;
  border: 1px solid $color-primary;
  text-align: center;
  font-size: 12px;
  background: transparent;
  color: $color-primary;
}
.get-code-component:disabled {
  background: #f7f8fa;
  color: #9da3ac;
  border-color: #bbc4d0;
}
</style>
