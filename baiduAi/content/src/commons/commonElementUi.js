/* eslint-disable */
import { validData } from '@/components/avue/utils/util'
import { MessageBox } from 'element-ui'

export default {
  install: (Vue) => {
    Vue.prototype.$Confirm = function (option) {
      typeof option === 'string' && (option = { message: option })
      let { message, title = '温馨提示' } = option
    
      return awaitFormResolve(
        MessageBox.confirm(message, title, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          ...option,
          customClass: 'common-message ' + (option.customClass || '')
        })
      )
    }

    Vue.prototype.validData = validData
    //全局默认图片
    Vue.prototype.$DEFAULT_PIC = require('@/assets/images/default.png')
  }
}
