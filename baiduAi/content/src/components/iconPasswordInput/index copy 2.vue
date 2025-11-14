<template>
  <!-- 自定义密码框 -->
  <div>
    <template v-if="!needRemember">
      <input type="text" class="clip" tabindex="1000" />
      <input type="password" class="clip" tabindex="1001" />
    </template>

    <!-- <div ref="placeholder" class="placeholder" @click="$refs.passwordInput.focus()" v-show="showPlaceholder">
      {{ $attrs.placeholder || '请输入密码' }}
    </div> -->

    <el-input
      v-model="text"
      class="password-input"
      ref="hiddenPasswordInput"
      hidden
      type="password"
      @blur="blurHandler1"
      @input="inputHandler1"
      @focus="focusHandler1"
    ></el-input>

    <Caret :isFocus="isFocus">
      <div>
        <el-input
          ref="passwordInput"
          :key="key"
          :placeholder="$attrs.placeholder || '请输入密码'"
          :type="passwordType"
          :clearable="showClearable"
          :auto-complete="!needRemember ? 'new-password' : ''"
          :class="[!needEmpty && 'none-need-empty']"
          v-model="text"
          v-bind="$attrs"
          v-on="$listeners"
          @blur="blurHandler"
          @focus="focusHandler"
        ></el-input>
        <!-- <i ref="passwordIcon" :class="['password-icon', showClear && 'password-pos']" @click="changeIcon">
          <img src="./icon/ic_preview_close.svg" v-if="passwordType == 'password'" />
          <img src="./icon/ic_preview.svg" v-else />
        </i> -->
      </div>
    </Caret>
  </div>
</template>

<script>
import Caret from './module/caret'
import { getUUID } from '@/utils'
export default {
  components: {
    Caret
  },

  model: {
    prop: 'value',
    event: 'input'
  },

  props: {
    clearable: {
      type: Boolean,
      default: true
    },

    //是否需要空格，通过空格去除浏览器记住密码
    needEmpty: {
      type: Boolean,
      default: false
    },

    //是否需要记住密码
    needRemember: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      passwordInputFocus: false,
      hiddenPasswordInputFocus: false,

      isMounted: false,
      key: getUUID(),
      text: '',
      passwordType: 'password',
      showClear: false
    }
  },

  watch: {
    text(newVal) {
      const { isMounted, hiddenPasswordInput } = this
      if (!isMounted) return
      if (!newVal) {
        this.key = getUUID()
        hiddenPasswordInput.focus()
        return
      }
      this.$refs.passwordInput && this.$refs.passwordInput.focus()
    }
  },

  computed: {
    hiddenPasswordInput({ isMounted }) {
      if (!isMounted) return null
      const {
        $refs: { hiddenPasswordInput }
      } = this
      return hiddenPasswordInput
    },

    passwordInput({ isMounted }) {
      if (!isMounted) return null
      const {
        $refs: { passwordInput }
      } = this
      return passwordInput
    },

    isEmpty({ text }) {
      return !text.length
    },

    isFocus({ isEmpty, passwordInputFocus, hiddenPasswordInputFocus }) {
      return isEmpty && (passwordInputFocus || hiddenPasswordInputFocus)
    },

    showPlaceholder({ text, needEmpty }) {
      if (!needEmpty) return false
      try {
        return text.length < 2
      } catch {
        return true
      }
    },

    showClearable({ showPlaceholder, clearable }) {
      return !showPlaceholder && clearable
    }
  },

  mounted() {
    this.isMounted = true
    //监听input组件中的showClear计算属性的变化
    // this.appendAndWatchPassowrdIcon()
  },

  methods: {
    focusHandler() {
      const { hiddenPasswordInput, isEmpty } = this
      if (!isEmpty) return
      hiddenPasswordInput.focus()
      this.$nextTick(() => {
        this.passwordInputFocus = true
      })
    },

    focusHandler1() {
      this.$nextTick(() => {
        this.passwordInputFocus = true
      })
    },

    blurHandler() {
      console.log('blurHandler')
      this.$nextTick(() => {
        this.passwordInputFocus = false
      })
    },

    blurHandler1() {
      console.log('blurHandler1')
      this.$nextTick(() => {
        this.hiddenPasswordInputFocus = false
      })
    },

    inputHandler1(newVal) {
      if (!newVal.length) return
      this.$refs.passwordInput.focus()
    },

    changeIcon() {
      if (this.passwordType == 'password') {
        this.passwordType = 'text'
      } else {
        this.passwordType = 'password'
      }
    },

    fillPlaceholderStyle(el) {
      const inputEl = this.$refs.passwordInput.$el.getElementsByTagName('input')[0]
      const styles = window.getComputedStyle(inputEl)
      const placeholderStyle = {
        paddingLeft: styles.paddingLeft,
        color: '#c0c4cc',
        fontSize: '16px'
      }
      for (let key in placeholderStyle) {
        el.style[key] = placeholderStyle[key]
      }
    },

    //监听input组件中的showClear计算属性的变化
    appendAndWatchPassowrdIcon() {
      const { passwordIcon } = this.$refs
      //将passwordIcon添加到passwordInput容器中，修复鼠标移入父容器的时候，passwordIcon不会晃动
      this.$refs.passwordInput.$el.append(passwordIcon)
      // this.$refs.passwordInput.$el.append(placeholder)
      // this.fillPlaceholderStyle(placeholder)

      this.$watch('$refs.passwordInput.showClear', (newVal) => {
        this.showClear = newVal
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.el-input {
  position: relative;
  background: transparent;
}
.el-input.el-input + .el-input {
  margin-left: 0;
}
.placeholder {
  position: absolute;
  top: 50%;
  margin-left: 3px;
  transform: translateY(-50%);
}

.clip {
  position: absolute;
  top: -100000px;
  left: 0;
  width: 0;
  height: 0;
  clip: rect(0, 0, 0, 0);
  opacity: 0;
}
.password-icon {
  display: inline-block;
  position: absolute;
  width: 20px;
  height: 20px;
  right: 10px;
  top: 50%;
  transform: translateY(calc(-50% - 2px));
  img {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }
}

// 密码框眼睛图标与清除图标不重叠
.password-pos {
  right: 30px;
}

.password-input {
  position: absolute;
  // 将谷歌浏览器的密码提示移除屏幕
  top: -10000px;
  left: 0;
  clip: rect(0, 0, 0, 0);
  opacity: 0;
  .el-input__inner {
    /*color: transparent;
      //caret-color: $color-gray;
      background-color: transparent;*/
  }
}
</style>