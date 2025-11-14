<template>
  <div class="icon-input">
    <el-input
      ref="passwordInput"
      :placeholder="$attrs.placeholder || '请输入密码'"
      :type="passwordType"
      :clearable="clearable"
      v-bind="$attrs"
      v-on="$listeners"
    ></el-input>
    <i ref="passwordIcon" :class="['password-icon', showClear && 'password-pos']" @click="changeIcon">
      <img src="../icon/ic_preview_close.svg" v-if="showPassword" />
      <img src="../icon/ic_preview.svg" v-else />
    </i>
  </div>
</template>

<script>
import iconInputMixin from '../mixins/iconInputMixin'

export default {
  mixins: [iconInputMixin()],

  computed: {
    passwordType({ showPassword }) {
      return showPassword ? 'password' : 'text'
    }
  }
}
</script>

<style lang="scss" scoped>
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