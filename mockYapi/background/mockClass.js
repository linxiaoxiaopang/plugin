import axios from 'axios'
import Mock from 'mockjs'

import {
  createFormByDeepMapData,
  createFormColumns,
  fillForeignKeyList, formatMockData,
  getMockjsSyntax
} from './utils'

const NO_LOGIN_CODE = 40011

const service = axios.create({
  baseURL: 'http://192.168.10.245:3000'
})

export class MockClass {
  constructor() {
    this.form = {}
    this.url = 'http://192.168.10.245:3000/project/41/interface/api/10483'
    this.mockDescribeJson = '{}'
    this.optionList = {}
  }

  get mockDescribeData() {
    const mockDescribeJson = this.mockDescribeJson
    return JSON.parse(mockDescribeJson)
  }

  get id() {
    const url = this.url
    if (!url) return ''
    return url.split('/').pop()
  }

  awaitWrap(promise) {
    if (!(promise instanceof Promise)) return [null, promise]
    return promise.then((data) => [null, data]).catch((err) => [err, null])
  }

  async awaitFormResolve(promise) {
    return (await this.awaitWrap(promise))[1]
  }

  init() {
    this.form = createFormByDeepMapData(this.mockDescribeData)
    this.optionList = createFormColumns(this.form)
  }

  createMockData() {
    const foreignKeyList = []
    const syntaxRes = getMockjsSyntax(this.form, foreignKeyList)
    console.log('syntaxRes', syntaxRes)
    console.log('foreignKeyList', foreignKeyList)
    const mockRes = Mock.mock(syntaxRes)
    formatMockData(mockRes)
    fillForeignKeyList(mockRes, foreignKeyList)
    console.log('mockRes', mockRes)
  }

  validUrl() {
    if (!this.url) {
      return false
    }
    try {
      new URL(this.url)
    } catch {
      return false
    }
    return true
  }


  async getYApiData() {
    const isValid = this.validUrl()
    if (!isValid) return
    let [err, data] = await this.awaitFormResolve(this.getBody())
    if (err && data == NO_LOGIN_CODE) {
      const [err1] = await this.login()
      if (err1) return
        ;
      [err, data] = await this.awaitFormResolve(this.getBody())
      if (err) return
    }
    this.mockDescribeJson = data.res_body || '{}'
  }


  async getBody() {
    const res = await service({
      method: 'get',
      url: `/api/interface/get?id=${this.id}`
    })
    return this.handleAxiosData(res)
  }


  handleAxiosData(res) {
    if (res.status !== 200 || res.data && res.data.errcode !== 0) {
      return [true, res && res.data && res.data.errcode]
    }
    return [false, res.data.data]
  }


  async login() {
    const res = await service({
      method: 'POST',
      url: '/api/user/login',
      data: {
        email: '541953126@qq.com',
        password: 'Test123456'
      }
    })
    return this.handleAxiosData(res)
  }
}



