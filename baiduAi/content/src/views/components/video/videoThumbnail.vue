<template>
  <div class="video-thumbnail-component">
    <i :class="[playIcon]" class="icon" @click="togglePlayStatus"></i>
  </div>
</template>

<script>

export default {
  model: {
    prop: 'playing'
  },

  props: {
    playing: Boolean
  },

  computed: {
    playIcon({ playing }) {
      return playing ? 'el-icon-video-pause' : 'el-icon-video-play'
    }
  },

  methods: {
    togglePlayStatus() {
      this.$emit('input', !this.playing)
    }
  }
}

</script>

<style lang="scss" scoped>
.video-thumbnail-component {
  @include absPos();
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1;
}

.video-thumbnail-component::before {
  content: '';
}

.icon {
  font-size: 25px;
  color: #fff;
}
</style>
