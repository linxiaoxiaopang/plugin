<template>
  <div>
    <component :is="componentName" v-bind="$attrs" v-on="$listeners" />
  </div>
</template>

<script>
import IconInput from './module/iconInput'
import ShakingPasswordInput from './module/shakingPasswordInput'
export default {
  components: {
    IconInput,
    ShakingPasswordInput
  },

  props: {
    //是否需要记住密码
    needRemember: Boolean
  },

  computed: {
    componentName({ needRemember }) {
      if (needRemember) return IconInput
      return ShakingPasswordInput
    }
  }
}
</script>

<style>
</style>