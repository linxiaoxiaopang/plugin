<template>
  <video
    ref="video"
    class="video"
    v-bind="all$Attrs"
    @play="onPlay"
    @pause="onPause"
    @ended="onEnded"
  >
    <source :src="src"/>
  </video>
</template>

<script>
const DEFAULT_OPTION = {
  controls: true
}

export default {
  model: {
    prop: 'playing'
  },

  props: {
    src: {
      type: String,
      required: true
    },

    playing: Boolean
  },

  computed: {
    all$Attrs({ $attrs }) {
      return Object.assign({}, DEFAULT_OPTION, $attrs)
    },

    video() {
      return this.$refs.video
    }
  },

  watch: {
    playing(newVal) {
      if (newVal) {
        this.video.play()
        return
      }
      this.video.pause()
    }
  },

  methods: {
    onEnded() {
      this.togglePlayStatus(false)
    },

    onPause() {
      this.togglePlayStatus(false)
    },

    onPlay() {
      this.togglePlayStatus(true)
    },

    togglePlayStatus(status) {
      this.$emit('input', status)
    }
  }
}

</script>

<style lang="scss" scoped>
.video {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
}
</style>
