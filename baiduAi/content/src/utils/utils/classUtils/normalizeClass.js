import { filter, find } from 'lodash'
import { validData } from '@/components/avue/utils/util'

export const NormalizeClass = class NormalizeClass {
  constructor(option, include, exclude) {
    this.include = validData(include, [])
    this.exclude = validData(exclude, [])
    this.props = Object.keys(option)
    this.option = option
    this.filterProps = Object.create(null)
    this.filterOption = Object.create(null)
  }

  filterHandler() {
    const { excludeHandler, includeHandler } = this
    this.filterProps = includeHandler(excludeHandler(this.props, this.exclude), this.include)
    this.filterOption = this.filterProps.reduce((cur, prev) => {
      cur[prev] = this.option[prev]
      return cur
    }, {})
    return this.filterOption
  }

  excludeHandler(props, exclude) {
    return filter(props, (prop) => {
      return !find(exclude, (item)=> prop == item)
    })
  }

  includeHandler(props, include) {
    if (!include.length) return props
    return filter(props, (prop) => {
      return find(include, (item)=> prop == item)
    })
  }
}