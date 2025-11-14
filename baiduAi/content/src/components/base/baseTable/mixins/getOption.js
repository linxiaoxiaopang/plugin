/* eslint-disable */
import { getDicItemComplex } from '@/components/avue/utils/util'

export default function (param) {
  const { options = {} } = param || {}
  return {
    computed: {
      options() {
        return options
      },
      defaultOption() {
        return this.options?.default || {}
      },
      optionParams() {
        return {
          value: this.type
        }
      },
      option({ options, optionParams }) {
        return getDicItemComplex(options, optionParams, 'pageParams') || this[`${optionParams.value}Option`] || options.default || this.defaultOption
      }
    }
  }
}