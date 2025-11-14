<template>
  <el-switch
    v-model="text"
    :active-text="active[labelKey]"
    :active-value="active[valueKey]"
    :inactive-value="inactive[valueKey]"
    :inactive-text="inactive[labelKey]"
    :active-icon-class="activeIconClass"
    :inactive-icon-class="inactiveIconClass"
    :active-color="activeColor"
    :inactive-color="inactiveColor"
    :width="width"
    :disabled="disabled"
    :readonly="readonly"
    :class="{ 'is-inside': isInside }"
    @click.native="handleClick"
    @change="onchange"
  ></el-switch>
</template>

<script>
import create from '../../core/create'
import props from '../../core/props.js'
import event from '../../core/event.js'

export default create({
  name: 'switch',
  mixins: [props(), event()],
  props: {
    value: {},
    activeIconClass: String,
    inactiveIconClass: String,
    activeColor: String,
    inactiveColor: String,
    isInside: Boolean,
    width: Number,
    dic: {
      type: Array,
      default: () => {
        return [
          {
            value: 0
          },
          {
            value: 1
          }
        ]
      }
    }
  },
  data() {
    return {}
  },
  watch: {},
  created() {
  },
  mounted() {},
  computed: {
    active() {
      return this.dic[1] || {}
    },
    inactive() {
      return this.dic[0] || {}
    }
  },
  methods: {
    onchange(value) {
      this.$emit('change', value)
    },
    handleChange(value) {
      this.$emit('input', value)
    }
  }
})
</script>

<style lang="scss" scoped>
::v-deep {
  &.is-inside {
    line-height: 30px;
    height: 30px;

    .el-switch__core {
      height: 30px;
      border-radius: 15px;

      &::after {
        width: 24px;
        height: 24px;
        z-index: 1;
      }
    }
    &.is-checked {
      .el-switch__core {
        &::after {
          margin-left: -24px;
        }
      }
    }

    .el-switch__label {
      display: none;
      position: absolute;
      left: 0;
      right: 0;
      height: 30px;
      text-align: center;
      color: #fff;
      pointer-events: none;
      z-index: 1;

      &.is-active {
        display: block;
      }

      &.el-switch__label--left {
        margin-right: 0;
        margin-left: 20px;
      }
      &.el-switch__label--right {
        margin-right: 20px;
        margin-left: 0;
      }
    }
  }
}
</style>