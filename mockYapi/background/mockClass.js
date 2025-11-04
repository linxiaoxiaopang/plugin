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
  }

  awaitWrap(promise) {
    if (!(promise instanceof Promise)) return [null, promise]
    return promise.then((data) => [null, data]).catch((err) => [err, null])
  }

  async awaitFormResolve(promise) {
    return (await this.awaitWrap(promise))[1]
  }

  parseUrl(url) {
    const splitData = url.split('/').filter(Boolean)
    const basePath = '/' + splitData.shift()
    return {
      basePath,
      path: '/' + splitData.join('/')
    }
  }

  createMockData(mockDescribeJson) {
    const form = createFormByDeepMapData(mockDescribeJson)
    const foreignKeyList = []
    const syntaxRes = getMockjsSyntax(form, foreignKeyList)
    const mockRes = Mock.mock(syntaxRes)
    formatMockData(mockRes)
    fillForeignKeyList(mockRes, foreignKeyList)
    console.log('mockRes', mockRes)
    return mockRes
  }

  async getBody(id) {
    const res = await service({
      url: `/api/interface/get?id=${id}`,
      method: 'get'
    })
    return this.handleAxiosData(res)
  }

  async getProductList(projectId) {
    if (!projectId) throw `productId 不存在`
    const res = await service({
      method: 'get',
      url: `/api/interface/list_menu?project_id=${projectId}`
    })
    return this.handleAxiosData(res)
  }

  async getYapiId(data) {
    const { url, projectId } = data

    let [err, res] = await this.getProductList(projectId)
    if (err || !res) throw '接口不存在'
    res = res || []
    const tmpArr = []
    res.map(item => tmpArr.push(...item.list))
    const { path } = this.parseUrl(url)
    const fItem = tmpArr.find(item => item.path === path)
    if (!fItem) return ''
    return fItem._id
  }

  async getYApiData(request) {
    try {
      const yapiId = await this.getYapiId(request.data)
      if (!yapiId) throw '未找到接口'
      let [err, data] = await this.awaitFormResolve(this.getBody(yapiId))
      if (err && data == NO_LOGIN_CODE) {
        const [err1] = await this.login()
        if (err1) return
          ;
        [err, data] = await this.awaitFormResolve(this.getBody(yapiId))
        if (err) return
      }
      const mockDescribeJson = JSON.parse(data.res_body || '{}')
      const mockRes = this.createMockData(mockDescribeJson)
      return this.formatMockRes(mockRes, request.data)
    } catch (err) {
      return {
        code: 0,
        message: err
      }
    }
  }

  formatMockRes(mockRes, requestData) {
    mockRes.message = ''
    mockRes.detailMessage = ''
    mockRes.code = 0
    if (mockRes.page) {
      mockRes.page.pageIndex = requestData.data.page.pageIndex
      mockRes.page.pageSize = requestData.data.page.pageSize
      if(mockRes.data.length <= mockRes.page.pageSize) {
        mockRes.page.total = mockRes.data.length
      }
    }
    return mockRes
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



