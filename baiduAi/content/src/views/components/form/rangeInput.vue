<template>
  <div class="range-input">
    <div class="input-group">
      <el-input
        v-model.number="startValue"
        type="number"
        :min="min"
        :max="max"
        @change="validateStart"
        placeholder="开始值"
      />
      <span class="separator">-</span>
      <el-input
        v-model.number="endValue"
        type="number"
        :min="min"
        :max="max"
        @change="validateEnd"
        placeholder="结束值"
      />
      <span class="unit">{{ unit }}</span>
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'RangeInput',
  props: {
    label: {
      type: String,
      default: ''
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    unit: {
      type: String,
      default: '次'
    },
    value: {
      type: Array,
      default: () => [0, 0]
    },
    isValidate: Boolean
  },
  data() {
    return {
      startValue: this.value[0],
      endValue: this.value[1],
      error: ''
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.startValue = newVal[0]
        this.endValue = newVal[1]
      },
      deep: true
    },
    startValue(val) {
      this.$emit('input', [val, this.endValue])
    },
    endValue(val) {
      this.$emit('input', [this.startValue, val])
    }
  },
  methods: {
    validateStart() {
      if (!this.isValidate) return

      if (this.startValue > this.endValue && this.endValue !== 0) {
        this.error = '开始值不能大于结束值'
      } else {
        this.error = ''
      }
    },
    validateEnd() {
      if (!this.isValidate) return

      if (this.startValue > this.endValue && this.startValue !== 0) {
        this.error = '开始值不能大于结束值'
      } else {
        this.error = ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.separator {
  font-weight: bold;
  color: #333;
}

.unit {
  margin-left: 8px;
  color: #666;
}

.error-message {
  color: $color-danger;
  position: absolute;
  line-height: 1;
  margin-top: 4px;
  font-size: 12px;
}
</style>
