<template>
  <div class="saleDateTimeComponent">
    <avueCrudDate
      v-model="value"
      type="daterange"
      :size="size"
      @change="onchange"
    ></avueCrudDate>
    <avue-crud-radio
      v-if="finalDic.length"
      v-model="label"
      type="button-plain"
      :gutter="8"
      :dic="finalDic"
      @change="updateTime()"
      @search-change="handleChange()"
    ></avue-crud-radio>
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
    dic: {
      type: Array,
      default: () => [
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
    },
    size: {
      default: 'small'
    },
    hasTime: Boolean,
    labelValue: Number
  },
  data() {
    return {
      value: [],
      label: null
    }
  },
  computed: {
    finalDic({ dic, hasTime }) {
      dic = cloneDeep(dic)
      return dic.map((item, index) => {
        return {
          ...item,
          value: index,
          startValue: item.value,
          startUnit: validData(item.unit, 'days'),
          endValue: validData(item.endValue, 0),
          endUnit: validData(item.endUnit, 'days'),
          hasStartTime: validData(item.hasStartTime, item.hasTime, hasTime),
          hasEndTime: validData(item.hasEndTime, item.hasTime, hasTime)
        }
      })
    },
    curItem() {
      return find(this.finalDic, { value: this.label })
    }
  },
  watch: {
    time: {
      handler(time) {
        this.getLabel(time)
        this.value = time
      },
      immediate: true,
      deep: true
    },
    labelValue: {
      handler(labelValue) {
        if (!validatenull(labelValue)) {
          this.label = find(this.finalDic, { startValue: labelValue })?.value
          this.updateTime()
        }
      },
      immediate: true
    }
  },
  methods: {
    onchange(val) {
      this.getLabel(val)
      this.updateTime(val)
      this.handleChange()
    },

    updateTime(time = this.getTime()) {
      this.$emit('input', time)
      this.$emit('update:time', time)
      this.$emit('change', time)
    },
    handleChange() {
      this.$emit('search-change')
    },

    getLabel(time) {
      const item = this.getDicItemByTime(time)
      return this.label = item?.value ?? null
    },

    getTime(item = this.curItem) {
      if (validatenull(item)) return []

      let { startValue, endValue, startUnit, endUnit, hasStartTime, hasEndTime } = item

      let startTime = this.getDateTime(startValue, hasStartTime, startUnit)
      let endTime = this.getDateTime(endValue, hasEndTime, endUnit)
      let time = [
        startTime,
        endTime
      ]
      if (this.getMaxDateTime(startTime, endTime) === startTime) {
        time = [
          endTime,
          startTime
        ]
      }
      return time
    },
    getDateTime(date, hasTime, unit) {
      return this.$moment().subtract(date, unit).format(hasTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD')
    },
    getMaxDateTime(...args) {
      let tempArr = args.map(item => {
        return new Date(item).getTime()
      })
      let maxTime = Math.max(...tempArr)
      return args[tempArr.findIndex(item => item === maxTime)]
    },
    //时间是否label
    getDicItemByTime(time) {
      if(Array.isArray(time) && time[0] && time[1]) {
        const [startTime, endTime] = time
        return this.finalDic.find((item) => {
          const time = this.getTime(item)
          return time[0] === startTime && time[1] === endTime
        })
      }
      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.saleDateTimeComponent {
  position: relative;
  display: flex;
  justify-content: flex-start;
  .avue-radio-group {
    flex-shrink: 0;
    margin-right: 0;
    margin-left: 8px;
  }
}
</style>
