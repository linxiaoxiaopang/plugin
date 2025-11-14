<template>
  <div id="app">
    <UploadFolder v-if="pageIsRendered"/>
  </div>
</template>

<script>
import UploadFolder from '@/views/uploadFolder'

export default {
  name: 'App',

  components: {
    UploadFolder
  },

  data() {
    return {
      pageIsRendered: false
    }
  },

  mounted() {
    this.getPageRendered()
  },

  methods: {
    getPageRendered() {
      const aiEditWrapper = document.querySelector('.ai-edit-wraper')
      if (!aiEditWrapper) {
        setTimeout(() => {
          this.getPageRendered()
        }, 1000)
        return
      }
      this.pageIsRendered = true
    }
  }
}
</script>
