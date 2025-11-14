<template>
  <div class="am_payPwd" :id="`ids_${id}`">
    <input
      v-pwd-off="'own'"
      :uiid="`zd-pwd-${i}`"
      :type="iptType"
      maxlength="1"
      @input="changeInput"
      @click="changePwd"
      v-model="pwdList[i]"
      @keyup="keyUp($event)"
      @keydown="oldPwdList = pwdList.length"
      class="shortInput"
      v-for="(v, i) in length"
      :key="i"
      :ref="i"
    />
  </div>
  
</template>
<script>
export default {
  data() {
    return {
      pwdList: [],
      oldPwdList: [],
      isDelete: false,
      iptType:'password'
    }
  },
  props: {
    id: {
      type: String, // 当一个页面有多个密码输入框时，用id来区分
      default: '1'
    },
    dialogVisible:{
      type: Boolean
    },
    length: {
      type: Number,
      default: 6
    }
  },
  watch:{
    dialogVisible  () {
      if(this.dialogVisible === false){
        this.pwdList = []
      }
    }
  },
  mounted() {
    this.$refs[0].focus()
  },
  beforeDestroy(){
    this.iptType = 'text'
  },
  methods: {
    keyUp(ev) {
      let index = this.pwdList.length
      if (!index) return
      if (ev.keyCode === 8) {
        this.isDelete = true
        if (this.oldPwdList === this.pwdList.length) {
          if (index === this.pwdList.length) {
            this.pwdList.pop()
          }
          index--
        } else {
          index > 0 && index--
        }
        this.$refs[index].focus()
      } else if (this.isDelete && index === this.pwdList.length && /^\d$/.test(ev.key)) {
        this.isDelete = false
        this.pwdList.pop()
        this.pwdList.push(ev.key)
        this.$refs[this.pwdList.length] && this.$refs[this.pwdList.length].focus()
      }
      this.$emit('getPwd', this.pwdList.join(''))
      this.$emit('input', this.pwdList.join(''))
    },
    changePwd() {
      let index = this.pwdList.length
      index === this.length && index--
      this.$refs[index].focus()
    },
    changeInput() {
      let index = this.pwdList.length
      let val = this.pwdList[index - 1]
      if (!/[0-9]/.test(val)) {
        this.pwdList.pop()
        return
      }
      if (!val) {
        this.pwdList.pop()
        index--
        if (index > 0) this.$refs[index - 1].focus()
      } else {
        if (index < this.length) this.$refs[index].focus()
      }
    },
    validate() {
      return this.pwdList.length === this.length
    }
  }
}
</script>
<style lang="scss" scoped>
.am_payPwd {
  display: inline-block;
  // width: 242px;
  height: 60px;
  // border: 1px solid #999;
  // border-radius: 5px;
  padding: 10px 0;
  position: relative;
  margin-left: 1px;
  .shortInput {
    text-align: center;
    font-size: 20px;
    float: left;
    width: 40px;
    height: 40px;
    color: #333;
    outline: #ff0067;
    margin-right: 5px;
    // &:not(:last-child) {
    //   border-right: 1px solid #999;
    // }
  }
}
</style>
