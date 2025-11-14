<template>
  <el-row :gutter="8" class="multi-input" :class="{ 'is-error': isError }">
    <el-col v-for="(item, index) in curVal" :key="index" :span="4">
      <el-input
        v-model="item.description"
        size="small"
        placeholder="标签名"
        :class="{ 'is-right': !errors[index] }"
        @input="oninput(curVal, $event, index)"
      >
        <i v-if="item.description" slot="prefix" class="el-input__icon el-icon-delete" @click="handleDelete(index)"></i>
      </el-input>
    </el-col>
    <el-col :span="1.5">
      <slot name="add">
        <el-button type="text" icon="el-icon-plus" size="small" @click="add"></el-button>
      </slot>
    </el-col>
    <div class="error-msg">{{ errorMsg }}</div>
  </el-row>
</template>

<script>
export default {
  props: {
    value: String | Array,
    column: {
      type: Object,
      default: () => ({})
    },
    singleRules: Array | Object,
    setError: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      curVal: [
        {
          description: ''
        }
      ],
      errors: [],
      errorMsg: ''
    }
  },
  computed: {
    validateVal({ column: { prop }, rules }) {
      if (!rules) return () => true
      return (val, index) => {
        // console.log(val, rules)
        let error
        rules.forEach((rule) => {
          for (const key in rule) {
            if (val) {
              if (key === 'max') {
                if (val.length > rule[key]) {
                  error = rule.message
                }
              }
            }
          }
        })
        // console.log(error, this.errors)
        if (error) {
          this.setError(prop, error)
          this.errorMsg = error
        }
        this.$set(this.errors, index, !!error)
        if (!this.isError) {
          this.errorMsg = ''
          this.setError(prop)
        }
      }
    },
    isError({ errors }) {
      return errors.some(Boolean)
    },
    rules({ column: { singleRules: colRules }, singleRules }) {
      let rules = singleRules || colRules
      if (rules) {
        rules = Array.isArray(rules) ? rules : [rules]
        return rules
      }
    }
  },
  watch: {
    value: {
      handler(n) {
        // console.log(n)
        if (Array.isArray(n)) {
          if (!n.length) {
            n.push({
              description: ''
            })
          }
        } else {
          n = [
            {
              description: ''
            }
          ]
          this.oninput(n)
        }
        this.curVal = n
      },
      immediate: true,
      deep: true
    },
    isError(n) {
      this.$emit('error-change', n)
    }
  },
  // created() {
  //   console.log(this.column)
  // },
  methods: {
    oninput(curVal, val, index) {
      // console.log('oninput', curVal, val, index)
      this.validateVal(val, index)
      this.$emit('input', curVal)
    },
    onchange(val) {
      this.$emit('change', val)
    },
    add() {
      this.curVal.push({
        description: ''
      })
    },
    handleDelete(index) {
      let { curVal, errors } = this
      // if (curVal.length < 2) {
      //   return this.$message.warning('请至少输入一个')
      // }
      curVal.splice(index, 1)
      errors.splice(index, 1)
      curVal.forEach((item, index) => {
        this.validateVal(item.description, index)
      })
    }
  }
}
</script>

<style lang="scss">
.multi-input {
  position: relative;
  left: -4px;
  margin-left: 0 !important;
  .el-col {
    min-width: 88px;
    line-height: 40px;
  }
  .el-input__inner {
    padding-left: 20px;
    padding-right: 8px;
  }

  .el-input__icon {
    width: 15px;
  }

  .is-right {
    .el-input__inner {
      border-color: #dcdfe6 !important;
    }
  }
  &.is-error {
    padding-bottom: 16px;
    .el-input__inner {
      border-color: #ff4949;
    }
    .error-msg {
      position: absolute;
      top: calc(100% - 16px);
      left: 4px;
      color: #ff4949;
      font-size: 12px;
      line-height: 1;
      padding-top: 4px;
    }
  }
}
.is-error .is-error {
  padding-bottom: 0;
  .error-msg {
    display: none !important;
  }
}
</style>
