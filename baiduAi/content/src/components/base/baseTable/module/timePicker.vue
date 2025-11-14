<template>
  <div class="saleDateTimeComponent">
    <el-radio-group v-model="label" size="small">
      <el-radio v-for="item in option.option" :key="item.value" :label="item.value" border>
        {{ item.label }}
      </el-radio>
    </el-radio-group>
    <el-date-picker
      v-model="value"
      type="daterange"
      size="small"
      range-separator="/"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="yyyy-MM-dd"
      @change="pickerChange"
    >
    </el-date-picker>
  </div>
</template>

<script>
import { parseCharacterTime } from '@/utils'

export default {
  props: {
    time: {
      required: true
    },
    option: {
      type: Object,
      default() {
        return {
          option: [
            {
              label: '7天',
              value: 7
            },
            {
              label: '15天',
              value: 15
            },
            {
              label: '30天',
              value: 30
            }
          ]
        }
      }
    }
  },
  data() {
    return {
      value: this.time,
      labelTime: [],
      label: null
    }
  },
  watch: {
    time: {
      handler(n) {
        // console.log(n, this.labelTime, this.isSameTime(n, this.labelTime))
        if (!this.isSameTime(n, this.labelTime)) {
          this.value = n
        }
      },
      immediate: true,
      deep: true
    },
    label(newVal) {
      if (newVal !== null) {
        let startTime = this.getDateTime(newVal)
        let endTime = this.getDateTime()
        let time = [startTime, endTime]
        if (this.getMaxDateTime(startTime, endTime) === startTime) {
          time = [endTime, startTime]
        }
        this.labelTime = time
        // console.log(startTime, endTime, time)
        this.updateTime(time)
        this.value = []
      }
    }
  },
  methods: {
    updateTime(time) {
      let oTime = this.time
      if (!Array.isArray(time) || !Array.isArray(oTime) || time[0] !== oTime[0] || time[1] !== oTime[1]) {
        this.$emit('update:time', time)
        this.$emit('change', time)
      }
    },
    getDateTime(date = 0) {
      date = date - 1
      let time
      if (date === 0) {
        time = parseCharacterTime(new Date())
      } else {
        let dateTime = new Date()
        dateTime = dateTime.setDate(dateTime.getDate() - date - 1)
        dateTime = new Date(dateTime)
        time = parseCharacterTime(dateTime)
      }
      return time
    },
    getMaxDateTime(...args) {
      let tempArr = args.map((item) => {
        return new Date(item).getTime()
      })
      let maxTime = Math.max(...tempArr)
      return args[tempArr.findIndex((item) => item === maxTime)]
    },
    isSameTime(n, o) {
      if (this.timeInLabel(n)) return
      return Array.isArray(n) && Array.isArray(o) && n[0] === o[0] && n[1] === o[1]
    },

    //时间是否label
    timeInLabel(n) {
      try {
        if (Array.isArray(n) && n[0] && n[1]) {
          const [startTime, endTime] = n
          const dirDayNum = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60 * 24)
          const findItem = this.option.option.find(({ value }) => value == dirDayNum)
          if (findItem) {
            this.label = findItem.value
          }
          return !!findItem
        }
        return false
      } catch {
        return false
      }
    },
    pickerChange(val) {
      this.updateTime(val)
      this.label = null
    }
  }
}
</script>

<style lang="scss" scoped>
.saleDateTimeComponent {
  position: relative;

  display: flex;
  justify-content: flex-start;
  .el-radio-group {
    flex: 0 0 150px;
  }
  .el-date-editor {
    flex: 1;
  }
  ::v-deep {
    .el-radio__input {
      display: none;
    }
    .el-radio__label {
      padding: 0;
    }
    .el-radio--small.is-bordered {
      padding: 0 8px;
      height: 32px;
      line-height: 26px;
      margin: 0;
      margin-right: 5px;
    }
    .el-date-editor--daterange.el-input__inner {
      width: auto;
    }
  }
}
</style>
