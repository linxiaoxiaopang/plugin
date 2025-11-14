<template>
  <div v-if="inputType === 'daterange'" class="select-date-wrapper">
    <avue-crud-select slot="prepend" :size="size" v-model="curType" :dic="dicData" :clearable="false"></avue-crud-select>
    <avue-crud-date v-model="text" type="daterange" :size="size" @input="changeForm" @search-change="onchange"></avue-crud-date>
  </div>
  <el-input
    v-else
    v-model="text"
    size="small"
    class="select-input"
    clearable
    :placeholder="placeholders[curType]"
    @keyup.enter.native="onchange"
    @clear="clear"
    @input="changeForm"
  >
    <avue-crud-select slot="prepend" v-model="curType" :dic="dicData" :clearable="false"></avue-crud-select>
  </el-input>
</template>

<script>
import { validatenull } from '@/components/avue/utils/validate'
import { find } from 'lodash'

export default {
  props: {
    type: String,
    dicData: Array,
    form: {
      type: Object,
      default: () => ({})
    },
    list: {},
    dic: {},
    column: {},
    size: {}
  },
  data() {
    return {
      curType: '',
      text: ''
    }
  },
  computed: {
    curItem({ curType }) {
      return this.dicData?.find(({ value }) => value === curType) || {}
    },
    inputType() {
      return this.curItem.type || this.type
    },
    placeholders({ dicData }) {
      let tempObj = {}
      dicData.forEach((item) => {
        tempObj[item.value] = item.placeholder || `输入${item.label}`
      })
      return tempObj
    },
    ignoreKeysObj({ dicData }) {
      return dicData.reduce((prev, next) => {
        prev[next.value] = undefined
        return prev
      }, {})
    }
  },
  watch: {
    form: {
      handler(n) {
        this.text = n[this.curType] || ''
      },
      immediate: true,
      deep: true
    },
    curType() {
      if (!validatenull(this.text)) {
        this.onchange()
      }
    },
    dicData: {
      handler(n) {
        let { curType } = this
        if (validatenull(curType) || !find(n, { value: curType })) {
          this.curType = n[0].value
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    changeForm() {
      Object.assign(this.form, this.ignoreKeysObj, {
        [this.curType]: this.text
      })
    },
    onchange() {
      this.changeForm()
      this.$emit('search-change')
      this.$emit('change')
    },
    clear() {
      this.$emit('clear')
      this.onchange()
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-select {
  width: 115px;

  .el-input__inner {
    padding: 0 25px 0 10px;
  }
}
::v-deep.select-date-wrapper {
  display: flex;
  align-items: center;

  .el-select {
    flex-shrink: 0;
    z-index: 1;
    .el-input__inner {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
  .el-date-editor {
    margin-left: -1px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    &.is-active {
      z-index: 2;
    }
  }
}
</style>
