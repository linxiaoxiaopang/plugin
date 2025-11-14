<template>
  <!-- 自定义密码框 -->
  <div>
    <template v-if="!needRemember">
      <input type="text" class="clip" tabindex="1000" />
      <input type="password" class="clip" tabindex="1001" />
    </template>

    <div ref="placeholder" class="placeholder" @click="$refs.passwordInput.focus()" v-show="showPlaceholder">
      {{ $attrs.placeholder || '请输入密码' }}
    </div>
    <el-input
      ref="passwordInput"
      :placeholder="$attrs.placeholder || '请输入密码'"
      :type="passwordType"
      :clearable="showClearable"
      v-model="text"
      v-bind="$attrs"
      v-on="$listeners"
      @focus="focusHandler"
      :auto-complete="!needRemember ? 'new-password' : ''"
      :class="[!needEmpty && 'none-need-empty']"
    ></el-input>
    <i ref="passwordIcon" :class="['password-icon', showClear && 'password-pos']" @click="changeIcon">
      <img src="./icon/ic_preview_close.svg" v-if="passwordType == 'password'" />
      <img src="./icon/ic_preview.svg" v-else />
    </i>
  </div>
</template>

<script>
export default {
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
      text: this.needEmpty ? ' ' : '',
      passwordType: 'password',
      showClear: false
    }
  },

  watch: {
    text: {
      handler(newVal) {
        if (this.needEmpty) {
          if (newVal.length == 0 || (newVal && newVal[0] !== ' ')) {
            this.text = ' ' + newVal
          }
        } else {
          if (newVal && newVal[0] === ' ') {
            this.text = this.text.trim()
          }
        }

        this.$emit('input', this.text.trim())
      },

      immediate: true
    }
  },

  computed: {
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
    //监听input组件中的showClear计算属性的变化
    this.appendAndWatchPassowrdIcon()
    this.$nextTick(() => {
      this.readonly = false
    })
  },

  methods: {
    focusHandler () {
      if(this.text === ' ' && this.needEmpty) {
        //去除使用TBA按钮选中input时候的高亮
        this.text = this.text + ' '
        this.$nextTick(() => {
         this.text = this.text.replace(' ', '')
        })
      }
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
      const { passwordIcon, placeholder } = this.$refs
      //将passwordIcon添加到passwordInput容器中，修复鼠标移入父容器的时候，passwordIcon不会晃动
      this.$refs.passwordInput.$el.append(passwordIcon)
      this.$refs.passwordInput.$el.append(placeholder)
      this.fillPlaceholderStyle(placeholder)

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
.el-input.el-input {
  ::v-deep {
    input {
      text-indent: -5px;
    }
  }
}
.el-input.el-input.none-need-empty {
  ::v-deep {
    input {
      text-indent: 0;
    }
  }
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
</style>