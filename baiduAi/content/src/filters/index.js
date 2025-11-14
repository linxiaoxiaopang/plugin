import { PICSIZE } from '@/utils/constant'
export default {
  install(Vue) {
    Vue.filter('formatUrl', function (value, size = 'mid') {
      size = PICSIZE[size]

      const $this = new Vue()
      if (value && value.indexOf('http') > -1) {
        value = value + size
      }
      return value || require('@/assets/images/default.png')
    })
    Vue.filter('prvFormatUrl', function (value) {
      const $this = new Vue()
      return value
        ? [value && value.indexOf('http') > -1 ? value : $this.$serverRootPath + value]
        : [require('@/assets/images/default.png')]
    })
  }
}
