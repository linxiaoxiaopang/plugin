<template>
  <div class="saleDateTimeComponent">
    <el-radio-group v-model="label" :size="size">
      <el-radio v-for="item in dic" :key="item.value" :label="item.value" border>
        {{ item.label }}
      </el-radio>
    </el-radio-group>
    <el-date-picker
      v-model="value"
      type="daterange"
      :size="size"
      range-separator="-"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="yyyy-MM-dd"
      @input="pickerChange"
      v-bind="$attrs"
    >
    </el-date-picker>
  </div>
</template>

<script>
import { find, cloneDeep } from 'lodash'
import { validData } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  model: {
    prop: 'time'
  },
  props: {
    time: {
      required: true
    },
    size: {
      default: 'small'
    },
    hasTime: Boolean,
    emptyValue: {},
    defaultValue: {}
  },
  data() {
    return {
      value: this.time,
      labelTime: [],
      label: null
    }
  },
  computed: {
    dic({ hasTime }) {
      let dic = cloneDeep(
        this.$attrs.dic || [
          {
            label: '今日',
            value: 0
          },
          {
            label: '昨日',
            value: 1,
            endValue: 1
          }
        ]
      )
      return dic.map((item) => {
        return {
          ...item,
          endValue: validData(item.endValue, 0),
          hasStartTime: validData(item.hasStartTime, item.hasTime, hasTime),
          hasEndTime: validData(item.hasEndTime, item.hasTime, hasTime)
        }
      })
    },
    curItem() {
      return find(this.dic, { value: this.label })
    }
  },
  watch: {
    time: {
      handler(time) {
        if (validatenull(time)) {
          const { emptyValue } = this
          if (!validatenull(emptyValue)) {
            return this.$emit('input', this.setValue(emptyValue))
          }
        }

        if (!Array.isArray(time)) return this.$emit('input', [])

        let item = this.getDicItemByTime(time)
        this.label = item?.value ?? null
        // console.log(time, item)

        // console.log(this.labelTime, this.isSameTime(time, this.labelTime))
        this.value = time
      },
      immediate: true,
      deep: true
    },
    label(newVal) {
      if (newVal !== null) {
        let time = this.getTime()
        this.labelTime = time
        this.updateTime(time)
      } else {
        this.labelTime = []
      }
    },

    emptyValue: {
      handler(val) {
        if (validatenull(val)) return
        this.setValue(val)
      },
      immediate: true
    },
    defaultValue: {
      handler(val) {
        if (validatenull(val)) return
        this.setValue(val)
      },
      immediate: true
    }
  },
  methods: {
    updateTime(time) {
      let oTime = this.time
      if (
        !Array.isArray(time) ||
        !Array.isArray(oTime) ||
        time[0] !== oTime[0] ||
        time[1] !== oTime[1]
      ) {
        this.$emit('input', time)
        this.$emit('change', time)
        this.$emit('search-change', time)
      }
    },
    getTime(item = this.curItem) {
      let { value, endValue, hasStartTime, hasEndTime } = item

      let startTime = this.getDateTime(value, hasStartTime)
      let endTime = this.getDateTime(endValue, hasEndTime)
      let time = [startTime, endTime]
      if (this.getMaxDateTime(startTime, endTime) === startTime) {
        time = [endTime, startTime]
      }
      return time
    },
    getDateTime(date, hasTime) {
      return this.$moment()
        .subtract(date, 'day')
        .format(hasTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
    },
    getMaxDateTime(...args) {
      let tempArr = args.map((item) => {
        return new Date(item).getTime()
      })
      let maxTime = Math.max(...tempArr)
      return args[tempArr.findIndex((item) => item === maxTime)]
    },

    //时间是否label
    getDicItemByTime(time) {
      if (Array.isArray(time) && time[0] && time[1]) {
        const [startTime, endTime] = time
        return this.dic.find((item) => {
          const time = this.getTime(item)
          return time[0] === startTime && time[1] === endTime
        })
      }
      return false
    },
    pickerChange(val) {
      if (!validatenull(this.emptyValue) && validatenull(val)) {
        val = this.setValue(this.emptyValue)
      }

      this.updateTime(val)
    },
    setValue(time) {
      time = Array.isArray(time) ? time : [time, time]

      const dicItem = find(this.dic, { value: time[0], endValue: time[1] })
      if (dicItem) this.label = dicItem.value

      time = time.map(date => this.getDateTime(date))
      return this.value = time
    },

    isSameTime(n, o) {
      return Array.isArray(n) && Array.isArray(o) && n[0] === o[0] && n[1] === o[1]
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
    flex: 0 0 auto;
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
    .el-radio--mini.is-bordered {
      padding: 0 8px;
      height: 28px;
      line-height: 26px;
      margin: 0;
      margin-right: 5px;
    }
    .el-radio--small.is-bordered {
      padding: 0 12px;
      height: 32px;
      line-height: 30px;
      margin: 0 8px 0 0;
    }

    .el-date-editor--daterange.el-input__inner {
      width: auto;
    }
  }
}
</style>
