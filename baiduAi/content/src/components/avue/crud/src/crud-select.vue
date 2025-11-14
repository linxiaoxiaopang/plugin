<template>
  <el-select
    v-model="text"
    :popperClass="`uiid-zd-${prop}-popper`"
    :size="size"
    :placeholder="placeholder || '请选择' + label"
    :disabled="disabled || readonly"
    :clearable="clearable"
    :filterable="filterable"
    :multiple="multiple"
    :class="{ 'is-readonly': readonly }"
    v-on="new$listeners"
  >
    <span v-if="isGroup">
      <el-option-group
        v-for="group in dic"
        :key="group[dictLabel]"
        :label="group[dictLabel]">
        <base-option
          v-for="item in group.options"
          :key="item[dictValue]"
          :label="item[dictLabel]"
          :value="item[dictValue]"
          :data="item"
          :disabled="item.disabled"
          :filterMethod="filterMethod"
        ></base-option>
      </el-option-group>
    </span>
    <span v-else>
      <base-option
        v-for="(item,index) in dic"
        :key="index"
        :label="item[dictLabel]"
        :value="item[dictValue]"
        :data="item"
        :disabled="item.disabled"
        :filterMethod="filterMethod"
      >
        <slot :row="item"></slot>
      </base-option>
    </span>
  </el-select>
</template>

<script>
import baseOption from '@/components/baseOption'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  components: {
    baseOption
  },
  name: 'AvueCrudSelect',
  props: {
    label: {
      type: String,
      default: ''
    },
    prop: {
      type: String,
      default: ''
    },
    value: {
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    },
    filterable: {
      type: Boolean,
      default: false
    },
    filterMethod: Function,
    multiple: Boolean,
    dic: {
      type: Array,
      default: () => {
        return []
      }
    },
    props: {
      default: () => {
        return {}
      }
    },
    validateDicValue: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      text: '',
      oValue: ''
    }
  },
  computed: {
    dictLabel() {
      return this.props.label || 'label'
    },
    dictValue() {
      return this.props.value || 'value'
    },
    new$listeners() {
      return Object.assign(
        {
          ...this.$listeners
        },
        {
          change: this.handleChange
        }
      )
    },
    isGroup({ dic }) {
      return dic?.[0]?.options
    },
    flatDic({ isGroup, dic }) {
      dic = dic || []
      if (isGroup) {
        dic = dic.reduce((prev, next) => {
          return prev.concat(next.options || [])
        }, [])
      }
      return dic.filter(item => !item.disabled)
    },

    isValidateDicValue() {
      return this.validateDicValue && !this.multiple
    }
  },
  watch: {
    value: {
      handler(n) {
        this.text = n

        if (this.isValidateDicValue && !validatenull(n)) {
          if (validatenull(this.flatDic)) {
            this.oValue = n
          } else {
            this.validateValueByDic()
          }
        }
      },
      immediate: true
    },
    flatDic: {
      handler(n, o) {
        if (!this.isValidateDicValue) return

        // dic 被置空时，值也被置空
        if (o?.length && !n?.length) {
          this.oValue = ''
          return this.oninput()
        } else if (!validatenull(this.oValue) && !validatenull(n)) {
          // 问题：只有 dic 不为空时，this.oValue 才会被置空，在 dic 切换之后要手动置空 this.oValue
          let { oValue } = this
          if (this.validateValueByDic(oValue)) {
            this.oninput(oValue)
          }
          this.oValue = ''
        } else {
          this.validateValueByDic()
        }

      },
      immediate: true
    }
  },
  methods: {
    oninput(value = '') {
      this.text = value
      this.$emit('input', value)
    },
    handleChange(value) {
      this.$emit('change', value)
      this.$emit('search-change')
    },
    validateValueByDic(value = this.value) {
      let { dictValue, flatDic } = this
      if (!validatenull(value)) {
        let valid = flatDic.some(item => item[dictValue] === value)
        // console.log(valid, flatDic, value)
        if (!valid) {
          this.oninput()
        }
        return valid
      }
    }
  }
}
</script>

<style>
.is-readonly .el-input.is-disabled .el-input__inner {
  color: #606266;
  background-color: #fff;
  cursor: pointer;
}
.is-readonly .el-input.is-disabled .el-input__icon {
  cursor: pointer;
}
</style>
