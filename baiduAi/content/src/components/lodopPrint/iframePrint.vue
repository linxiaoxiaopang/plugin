<script>
import { getURLByResponseType } from '@/utils'

export default {
  data() {
    return {
      printable: ''
    }
  },

  methods: {
    async printHandler(url) {
      const blob = await getURLByResponseType(url)
      if (!blob) return this.$message.error('打印失败')
      const printable = URL.createObjectURL(blob)
      this.printable = printable
      const iframe = this.$refs.iframe
      try {
        return await new Promise(resolve => {
          const func = () => {
            iframe.contentWindow.print()
            resolve([false, null])
            const handler = () => {
              URL.revokeObjectURL(printable)
              iframe.removeEventListener('load', func)
              window.removeEventListener('focus', handler)
            }
            window.addEventListener('focus', handler)
          }
          iframe.addEventListener('load', func)
        })
      } catch {
        return [true, null]
      }
      // await waitTimeByNum(2000)
      // return await this.$lodopPrintPdf({
      //   printable
      // })
    }
  },

  render(h) {
    return h('iframe', { ref: 'iframe', class: {'global-print_clip': true}, attrs: { src: this.printable } })
  }
}
</script>
