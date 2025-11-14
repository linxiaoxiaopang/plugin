<template>
  <el-input
    v-model="text"
    :type="curItem.type"
    :size="size"
    class="select-input"
    clearable
    :placeholder="placeholders[curType]"
    :disabled="disabled"
    @keyup.enter.native="searchChange"
    @clear="searchChange"
    @input="oninput"
    @change="onchange"
  >
    <avue-crud-select
      :slot="finalSelectPosition"
      v-model="curType"
      popperClass="select-input__popper"
      :dic="dicData"
      :size="size"
      :disabled="disabled"
      :clearable="false"
      :style="{ width: finalSelectWidth }"
    ></avue-crud-select>
  </el-input>
</template>

<script>
import { setPx, validData } from '@/components/avue/utils/util'
import { find } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  props: {
    prop: String,
    dic: Array,
    form: {
      type: Object,
      default: () => ({})
    },
    value: {},
    selectType: String,
    selectWidth: {},
    column: {
      type: Object,
      default: () => ({})
    },
    disabled:{
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'small'
    },
    // prepend | append
    selectPosition: {
      type: String,
      default: 'prepend'
    }
  },
  data() {
    return {
      curType: '',
      text: ''
    }
  },
  computed: {
    curItem() {
      return find(this.dicData, { value: this.curType }) || {}
    },

    finalSelectPosition() {
      return this.selectPosition || this.column.selectPosition || 'prepend'
    },
    finalSelectWidth() {
      return setPx(this.selectWidth || this.column.selectWidth)
    },

    placeholders({ dicData, column }) {
      let tempObj = {}
      dicData.forEach(item => {
        tempObj[item.value] = item.placeholder || column.placeholder || `输入${item.label}`
      })
      return tempObj
    },
    ignoreKeysObj({ dicData }) {
      return dicData.reduce((prev, next) => {
        prev[next.value] = undefined
        return prev
      }, {})
    },
    dicData() {
      return this.dic || []
    },

    selectProp({ column }) {
      return validData(column.selectProp, `${ column.prop }SelectProp`)
    }
  },
  watch: {
    value: {
      handler(n) {
        this.text = n
      },
      immediate: true
    },
    form: {
      handler(n) {
        if (!validatenull(n)) this.text = n[this.curType] || ''
      },
      immediate: true,
      deep: true
    },
    curType(n) {
      let val = this.text
      if (val) {
        this.changeForm()
        this.$emit('input', this.text)
        this.$emit('change')
        this.$emit('search-change')
      }
      this.$emit('update:selectType', n)
    },
    dicData: {
      handler(n) {
        this.curType = n[0]?.value
      },
      immediate: true,
      deep: true
    },

    curItem: {
      handler(n) {
        this.$emit('update:item', n)
      },
      immediate: true
    },
    selectType: {
      handler(n) {
        if (find(this.dicData, { value: n })) this.curType = n
      },
      immediate: true
    }
  },
  methods: {
    changeForm() {
      if (this.selectProp) {
        this.$set(this.form, this.selectProp, this.curType)
      }

      const { form, ignoreKeysObj } = this
      for (const key in ignoreKeysObj) {
        if (key in form) form[key] = ignoreKeysObj[key]
      }
      this.$set(form, this.curType, this.text)
    },
    oninput() {
      this.changeForm()
      this.$emit('input', this.text)
    },
    onchange() {
      this.changeForm()
      this.$emit('change')
    },
    searchChange() {
      this.changeForm()
      this.$emit('search-change')
    },

    setPx
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-input-group__append, .el-input-group__prepend {
    background-color: #F5F7FA;
  }
  &.el-select {
    width: 88px;
    .el-input__inner {
      padding: 0 20px 0 12px;
      color: $color-content !important;
      border-radius: $border-radius--mini 0 0 $border-radius--mini;
    }
    .el-input__suffix {
      right: -2px;
    }
    .el-select__caret {
      font-size: 12px;
      color: $color-content;
    }
  }
  .el-input__inner {
    border-radius: 0 $border-radius--mini $border-radius--mini 0;
  }
}
</style>
<style lang="scss">
.select-input__popper {
  min-width: 124px !important;
}
</style>
