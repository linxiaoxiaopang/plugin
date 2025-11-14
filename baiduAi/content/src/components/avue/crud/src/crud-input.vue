<template>
  <el-button v-if="currentType === 'clickInput'" class="crud-input" type="text">
    <div class="crud-input-text">{{ formatter(text) }}</div>
    <i v-if="canEdit" class="el-icon-edit el-icon--right text-primary" @click="onclickEdit"></i>
  </el-button>
  <el-input
    v-else
    v-pwd-off="typeParam === 'password'"
    ref="input"
    class="crud-input"
    :class="{ 'is-readonly': readonly }"
    :size="size"
    :clearable="clearable"
    :resize="resize"
    v-model="text"
    :type="typeParam"
    :autosize="{ minRows, maxRows }"
    :placeholder="placeholder || ('请输入' + label)"
    :disabled="isDisabled"
    :readonly="readonly"
    :show-password="showPassword"
    @keyup.enter.native="searchChange"
    @clear="searchChange"
    @blur="onblur"
    v-bind="$attrs"
    v-on="new$listeners"
  >
    <template slot="suffix">
      <slot name="suffix"></slot>
    </template>
    <template slot="prepend" v-if="finalPrependText || $slots.prepend">
      <slot name="prepend">{{ finalPrependText }}</slot>
    </template>
    <template slot="append" v-if="finalAppendText || $slots.append">
      <slot name="append">{{ finalAppendText }}</slot>
    </template>
  </el-input>
</template>

<script>
import { isNumber } from '@/components/avue/utils/validate'

export default {
  name: 'AvueCrudInput',
  data() {
    return {
      text: this.value,
      currentType: ''
    }
  },
  props: {
    form: {},
    column: {
      type: Object,
      default: () => ({})
    },
    label: {
      type: String,
      default: ''
    },
    value: {
      default: ''
    },
    formatter: {
      type: Function,
      default: (val) => val
    },
    formatText: Function,
    number: Boolean,
    clearable: {
      type: Boolean,
      default: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    minRows: {
      type: String | Number,
      default: '3'
    },
    maxRows: {
      type: String | Number,
      default: '4'
    },
    showPassword: {
      type: Boolean,
      default: false
    },
    resize: {
      type: String,
      default: 'none'
    },
    appendText: String,
    prependText: String
  },
  watch: {
    value: function (n, o) {
      this.text = this.value
    },
    type: {
      handler(n) {
        this.currentType = n
      },
      immediate: true
    }
  },
  computed: {
    typeParam: function() {
      if (this.type === 'textarea') {
        return 'textarea'
      } else if (this.type === 'password') {
        return 'password'
      } else if (this.number || this.type === 'number') {
        return 'number'
      } else {
        return 'text'
      }
    },
    canEdit() {
      return !this.disabled && !this.readonly
    },
    isDisabled({ readonly, disabled }) {
      return disabled || readonly
    },

    finalAppendText() {
      return this.appendText || this.column.appendText
    },
    finalPrependText() {
      return this.prependText || this.column.prependText
    },

    new$listeners({ $listeners }) {
      const new$listeners = { ...$listeners }
      new$listeners.input = this.handleChange
      return new$listeners
    }
  },
  mounted() {},
  methods: {
    handleChange(value) {
      if (this.formatText) value = this.text = this.formatText(value)
      this.$emit('input', value)
    },
    searchChange() {
      this.validNumber()
      this.$emit('search-change', this.text)
    },
    onblur() {
      this.currentType = this.type
      this.validNumber()
    },

    onclickEdit() {
      this.currentType = 'text'
      this.$nextTick(function () {
        this.$refs.input.focus()
      })
    },

    validNumber() {
      let val = this.text
      if (this.number && val && !isNumber(val)) {
        this.text = ''
        this.handleChange('')
      }
    }
  },
  directives: {
    'pwd-off': {
      bind(el, binding) {
        if (binding.value === false) return
        var input = el.getElementsByClassName('el-input__inner')[0]
        if (binding.value === 'own') {
          input = el
        }
        input.onfocus = onfocus
        input.onblur = onblur
        input.onblur()
        // console.log(el, input)

        function onfocus() {
          // console.log('onfocus')
          input.addEventListener('click', handleClick)
          input.addEventListener('keydown', handleKeydown)
          input.addEventListener('mousedown', handleMousedown)
          //使用setTimeout，告诉JS是异步执行，这样子，就可以阻止第一次点击获取焦点时，下拉用户密码清
          //单的框的出现
          setTimeout(() => {
            //获取焦点时 同时去除只读，这样可以获取光标，进行输入
            input.removeAttribute('readonly')
          }, 300)
        }
        function onblur() {
          // console.log('onblur')
          //失去焦点立马更新为只读
          input.setAttribute('readonly', 'true')
        }
        function handleClick(e) {
          //为什么先失去焦点，在获取焦点，这样子可以避免第二次或更多次连续点击输入框时，出现的用户密
          // 码清单的框可以快速去除
          // 绑定为own时不点击，否则6位密码框会有bug，不会自动跳回未输入的框上
          if (binding.value === 'own') return
          if (e.type === 'click') {
            input.blur()
            input.focus()
          }
        }
        function handleKeydown(e) {
          if (e.type === 'keydown') {
            const keyCode = e.keyCode
            const passwordText = input
            const len = passwordText.value.length
            if ([8, 46].includes(keyCode)) {
              //backspace 和delete
              if (len === 1) {
                passwordText.value = ''
                return false
              }
              if (e.target.selectionStart === 0 && e.target.selectionEnd === len) {
                passwordText.value = ''
                return false
              }
            } else if ((len === 0 && [32].includes(keyCode)) || e.ctrlKey) {
              input.blur()
              input.focus()
            }
            return true
          }
        }
        function handleMousedown(e) {
          if (e.type === 'mousedown') {
            input.blur()
            input.focus()
          }
        }
        // 绑定为own时先对每个输入框进行失焦和聚焦，后续再点击不会出现自动输入的提示
        if (binding.value === 'own') {
          input.blur()
          input.focus()
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  &.el-input,
  &.el-textarea {
    &.is-readonly.is-disabled {
      .el-input__inner,
      .el-textarea__inner {
        background-color: #fff;
        border-color: #DCDFE6;
        color: #606266;
        cursor: default;
      }
    }
  }
}
</style>
<style lang="scss">
.crud-input {
  &.el-button--text {
    width: 100%;
    height: 40px;
    color: inherit;
    text-align: left;
    .crud-input-text {
      display: inline-block;
      max-width: calc(100% - 20px);
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
    }
  }
}
</style>
