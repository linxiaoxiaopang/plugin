/* eslint-disable */
import { GetLastPromise } from '@/utils/promise'
import { cloneDeep } from 'lodash'
import { getFormColumn } from '@/components/avue/utils/get'
import { validatenull } from '@/components/avue/utils/validate'

// fromVm: AvueForm
export class FormControl {
  constructor({ form = {}, formOption = {}, fromVm = {} }) {
    this.form = form
    this.fromVm = fromVm
    this.fromThat = new Proxy({}, {
      get: (target, key) => {
        // console.log([key, this[key], fromVm[key]])
        return this[key] || fromVm[key] || {}
      }
    })
    formOption = cloneDeep(formOption)
    
    this.propOption = getFormColumn(formOption)
    this.controlOption = this.propOption.filter((column) => column.control)
    this.objectOption = this.propOption.reduce((prev, cur) => {
      prev[cur.prop] = cur
      return prev
    }, {})
  
    this.controledProps = []
    this.objectOption = new Proxy(this.objectOption, {
      get: (target, p) => {
        const column = target[p]
        // console.log({ p, column, target })
        if (column?.control && !this.controledProps.includes(p)) {
          this.doControl(column)
        }
        return column
      }
    })
  }
  
  getLastPromise = new GetLastPromise()
  handleControl = async () => {
    this.controledProps = []
    for (const column of this.controlOption) {
      await this.getLastPromise.globalWait()
      this.doControl(column)
    }
  }
  // 有前置依赖需要提前计算：
  // 在this.objectOption的getter里，判断依赖的column是否有control且未执行，是则执行一次
  doControl = (column) => {
    this.controledProps.push(column.prop)
    let { form, objectOption, fromThat } = this
    let props = column.control(form[column.prop], form, column, fromThat)
    if (!validatenull(props)) {
      for (const prop in props) {
        Object.assign(objectOption[prop], props[prop])
      }
    }
  }
}