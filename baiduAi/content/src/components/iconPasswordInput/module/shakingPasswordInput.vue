<template>
  <!-- 自定义密码框 -->
  <div class="icon_password_input">
    <input type="text" class="clip" tabindex="1000" />
    <input type="password" class="clip" tabindex="1001" />

    <el-input
      class="clip"
      ref="hiddenPasswordInput"
      hidden
      type="password"
      :validateEvent="false"
      @blur="blurHandler1"
      @input="inputHandler1"
      @focus="focusHandler1"
      v-on="$listeners"
    ></el-input>

    <Caret :isFocus="isFocus">
      <div>
        <el-input
          auto-complete="new-password"
          ref="passwordInput"
          :key="key"
          :placeholder="$attrs.placeholder || '请输入密码'"
          :type="passwordType"
          :clearable="clearable"
          v-bind="$attrs"
          :validateEvent="isValidateEvent"
          @blur="blurHandler"
          @focus="focusHandler"
          v-on="$listeners"
        ></el-input>
        <i ref="passwordIcon" :class="['password-icon', showClear && 'password-pos']" @click="changeIcon">
          <img src="../icon/ic_preview_close.svg" v-if="showPassword" />
          <img src="../icon/ic_preview.svg" v-else />
        </i>
      </div>
    </Caret>
  </div>
</template>

<script>
import iconInputMixin from '../mixins/iconInputMixin'
import Caret from './caret'
import { getUUID } from '@/utils'
export default {
  components: {
    Caret
  },

  mixins: [iconInputMixin()],

  data() {
    return {
      passwordInputFocus: false,
      hiddenPasswordInputFocus: false,
      isValidateEvent: false,
      isMounted: false,
      key: getUUID(),
      isFirstFocus: true
    }
  },

  watch: {
    text(newVal) {
      const { isMounted, hiddenPasswordInput } = this
      if (!isMounted) return
      if (!newVal) {
        this.key = getUUID()
        hiddenPasswordInput.focus()
        this.$nextTick(() => {
          this.appendAndWatchPassowrdIcon()
        })
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

    text() {
      return this.$attrs.value
    },

    isEmpty({ text }) {
      return !text.length
    },

    isFocus({ isEmpty, passwordInputFocus, hiddenPasswordInputFocus }) {
      return isEmpty && (passwordInputFocus || hiddenPasswordInputFocus)
    },

    passwordType({ showPassword, isEmpty }) {
      if (isEmpty) return 'text'
      return showPassword ? 'password' : 'text'
    }
  },

  mounted() {
    this.isMounted = true
  },

  methods: {
    focusHandler() {
      const { hiddenPasswordInput, isEmpty } = this
      if (!isEmpty) return
      this.passwordInputFocus = true
      hiddenPasswordInput.focus()
    },

    focusHandler1() {
      this.hiddenPasswordInputFocus = true
      if (this.isFirstFocus) {
        this.isValidateEvent = true
        this.isFirstFocus = false
      }
    },

    blurHandler() {
      this.passwordInputFocus = false
    },

    blurHandler1() {
      this.hiddenPasswordInputFocus = false
    },

    inputHandler1(newVal) {
      if (!newVal.length) return
      this.$refs.passwordInput.focus()
    }
  }
}
</script>
<style lang="scss" scoped>
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
</style>