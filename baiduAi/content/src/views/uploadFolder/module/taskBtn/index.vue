<template>
  <div :class="[shake && 'shake', 'missionComponent']">
    <ColorTextBtn class="iconfont icon-renwu font-color" @click="showHandler"></ColorTextBtn>
    <EForm ref="form" :sup_this="sup_this" :data="data" :taskDialog.sync="taskDialog" v-on="$listeners"/>
  </div>
</template>

<script>
import EForm from './module/form'

export default {
  components: {
    EForm
  },

  props: {
    data: {
      type: Array,
      required: true
    },

    taskDialog: Boolean
  },

  data() {
    return {
      sup_this: this,
      shake: false
    }
  },
  watch: {
    data() {
      this.shake = true
      this.shakeTimer && clearTimeout(this.shakeTimer)
      this.shakeTimer = setTimeout(() => {
        this.shake = false
      }, 2000)
    }
  },

  computed: {
    succeeded({ uploadTasks }) {
      return uploadTasks.filter(item => item.status == 'success')
    }
  },

  methods: {
    showHandler() {
      this.$emit('update:taskDialog', true)
    }
  }
}
</script>

<style lang="scss" scoped>
.missionComponent {
  position: relative;

  .countTip {
    height: 16px;
    width: 28px;
    border-radius: 20%;
  }
}

.count {
  position: absolute;
  display: flex;
  left: 20px;
  top: -2px;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  background: rgba(255, 87, 51, 1);
  border-radius: 50%;
  z-index: 2021;
}

.font-color.font-color {
  padding: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 20px;
}

.font-color:hover {
  color: #eee;
}

.missionComponent.shake {
  animation: shake 1s 2;
}

@keyframes shake {
  0%,
  100% {
    -webkit-transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    -webkit-transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    -webkit-transform: translateX(5px);
  }
}
</style>
