<template>
  <div class="countdown-timer">
    {{ formattedTime }}
  </div>
</template>

<script>
import { accDiv } from '@/utils'

export default {
  name: 'CountdownTimer',
  props: {
    // 倒计时时间（毫秒）
    milliseconds: {
      type: Number,
      default: 0
    },
    // 起始时间（毫秒时间戳）
    startTime: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      remainingTime: 0,
      timer: null
    }
  },
  computed: {
    formattedTime() {
      const hours = Math.floor(this.remainingTime / 3600);
      const minutes = Math.floor((this.remainingTime % 3600) / 60);
      const seconds = this.remainingTime % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    seconds() {
      return Math.ceil(accDiv(this.milliseconds, 1000))
    }
  },
  watch: {
    milliseconds: {
      handler() {
        this.resetTimer();
      },
      immediate: true
    },
    startTime: {
      handler() {
        if (this.startTime) {
          // 如果提供了起始时间，则计算从起始时间到现在的剩余时间
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
          const initialTime = Math.max(0, this.seconds - elapsed);
          this.resetTimer(initialTime);
        }
      },
      immediate: true
    }
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    resetTimer(seconds = this.seconds) {
      // 清除现有计时器
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      // 设置新的倒计时时间
      this.remainingTime = seconds
      
      // 启动新的计时器
      this.startTimer();
    },
    startTimer() {
      if (this.remainingTime <= 0) return;
      
      this.timer = setInterval(() => {
        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
          this.remainingTime = 0;
          clearInterval(this.timer);
          this.timer = null;
          this.$emit('countdown-finished');
        }
      }, 1000);
    }
  }
}
</script>

<style scoped>
.countdown-timer {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  font-family: 'Courier New', monospace;
}
</style>
