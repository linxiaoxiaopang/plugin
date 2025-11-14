<template>
  <div @click="printHandler" class="inline-block">
    <slot :loading="loading" :onclick="printHandler">
      <el-button :loading="loading" size="small" v-bind="$attrs" v-on="$listeners" type="primary"> 打印 </el-button>
    </slot>
  </div>
</template>

<script>
import axios from 'axios'
import { createPrintCallbackParams, loadAllImages } from '@/utils'
import { getPdfBase64ByDom, getPdfUrlByDom } from '@/utils/download'
import { isFunction, isElement, isPlainObject } from 'lodash'
import printJS from 'print-js'

//插件打印基础url
const PLUGIN_PRINT_BASE_URL = 'http://localhost:10010'

export default {
  props: {
    //String | Function | Element
    printable: {
      default: null
    },

    onError: Function,

    onSuccess: Function,

    name: {
      type: String,
      default: '打印文档'
    },

    //html | pdf
    type: {
      type: String,
      default: 'pdf'
    },

    //打印的纸张尺寸, 默认a4
    paperSize: {
      type: [String, Array],
      default: 'a4'
    },

    isWebPrint: {
      type: Boolean,
      default: true
    },

    isReturnPdf: true,

    isPreview: Boolean
  },

  data() {
    return {
      loading: false
    }
  },

  methods: {
    async printHandler() {
      const { isWebPrint } = this
      //浏览器打印
      if (isWebPrint) return this.webPrint()
      //插件打印，静默打印
      return this.pluginPrint()
    },

    async pluginPrint() {
      try {
        const [err, data] = await this.getPluginPrintData()
        if (err) {
          data && this.$message.error(data)
          this.onError && this.onError(data)
          return [true, null]
        }
        this.onSuccess && this.onSuccess(data)
        this.$message.success('连接打印插件成功')
        return [false, data]
      } finally {
        this.loading = false
      }
    },

    async getPluginPrintData() {
      const printable = await this.getPrintable()
      const [valid, errMsg] = this.validHandler(printable)
      if (valid) return [true, errMsg]
      let paramsData = printable
      if (!isPlainObject(printable)) {
        paramsData = {
          factorySystemOrderId: printable
        }
      }
      // 1 对外  2对内（满足同一个彩标 在对内mes上打出面单  在对外mes上打出配货单）
      paramsData.factoryType = 2
      paramsData.basePath = (process.env.VUE_APP_PLUGIN_PRINT_BASE_API || process.env.VUE_APP_BASE_API).replace(
        /\/?$/,
        '/'
      )

      console.log(8898989, paramsData, process.env)
      try {
        let url = `${PLUGIN_PRINT_BASE_URL}/doprint`
        const {
          data: res,
          data: { code, data }
        } = await axios.post(url, paramsData, {
          headers: {
            'Content-Type': 'text/plain'
          }
        })
        return [!$SUC({ code }) || !data, res]
      } catch (err) {
        return [true, this.dealWithErrorCode(err)]
      }
    },

    dealWithErrorCode(err) {
      const errStr = err.toString()
      if (errStr === 'Error: Network Error') {
        this.installationTips()
        return null
      }
      return errStr
    },

    async installationTips() {
      try {
        await this.$confirm(
          '如果您还未安装打印控件，点击下载按钮前往下载打印控件。如果您已经下载控件，请手动打开打印控件。',
          '温馨提示',
          {
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: '下载',
            cancelButtonText: '取消'
          }
        )
        this.loadPlugin()
      } catch {
        return false
      }
    },

    // 下载loadLodop
    loadPlugin() {
      window.open(
        'https://4u2-android-software-update.oss-cn-shenzhen.aliyuncs.com/JavaScan/%E6%89%AB%E5%8D%95.zip',
        '_self'
      )
    },

    validHandler(printable) {
      let errMsg = null
      if (!printable) errMsg = '打印数据不能为空'
      return [!printable, errMsg]
    },

    async webPrint() {
      //获取浏览器打印数据
      try {
        this.loading = true
        return await new Promise((resolve) => {
          //在下一个执行周期调用
          setTimeout(async () => {
            const [err, data] = await this.getWebPrintData()
            if (err) {
              if (this.type !== 'html') this.onError && this.onError()
              resolve([true, null])
              return data && this.$message.error(data)
            }
            //不返回pdf
            if (!this.isReturnPdf) printJS(data)
            //执行打印操作
            resolve([false, data])
          }, 0)
        })
      } finally {
        this.loading = false
      }
    },

    async getWebPdfData() {
      try {
        const { name, type, paperSize, onError, onSuccess } = this
        let printable = await this.getPrintable()
        if (type !== 'pdf') {
          const el = await this.getHtmlDom()
          const images = el.getElementsByTagName('img')
          await loadAllImages(images)
          if (!el) return [true, '打印dom不存在']
          const getPdfFunc = this.isReturnPdf ? getPdfBase64ByDom : getPdfUrlByDom
          printable = await getPdfFunc(el, name, {
            format: paperSize,
            onError,
            onSuccess
          })
        }
        return [false, printable]
      } catch {
        return [true, '打印异常']
      }
    },

    async getWebPrintData() {
      const { name, onSuccess } = this
      const [err, printable] = await this.getWebPdfData()
      if (err) return [err, printable]
      if (this.isReturnPdf) return [false, printable]
      return [
        false,
        createPrintCallbackParams(
          {
            documentTitle: name,
            name,
            printable
          },
          () => {
            if (onSuccess) {
              setTimeout(() => {
                onSuccess({
                  name,
                  printable
                })
              }, 500)
            }
          }
        )
      ]
    },

    async getHtmlDom() {
      let printable = await this.getPrintable()
      if (!printable) return null
      if (!isElement(printable)) printable = document.getElementById(printable)
      return printable
    },

    async getPrintable() {
      let { printable } = this
      //当printable是函数时,调用函数获取函数的返回值
      if (isFunction(printable)) {
        return await printable()
      }
      return printable
    }
  }
}
</script>

<style></style>
