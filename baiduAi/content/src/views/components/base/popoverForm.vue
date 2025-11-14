<template>
  <el-popover
    placement="right"
    width="400"
    trigger="manual"
    v-model="visible"
    v-bind="$attrs"
  >
    <div class="popover-form">
      <customForm
        ref="form"
        v-model="curValue"
        :option="finalOption"
        @reset-change="visible = !visible"
        @submit="onsubmit"
      ></customForm>
    </div>
    <el-button
      slot="reference"
      :size="size"
      :type="type"
      :icon="icon"
      @click="visible = !visible"
    >{{ text }}</el-button>
  </el-popover>
</template>

<script>
import customForm from '@/views/components/base/customForm'
import propsMixin from '@/mixins/dialog/props'
import { validData } from '@/components/avue/utils/util'
import { cloneDeep } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  components: {
    customForm
  },
  mixins: [
    propsMixin({
      value: {
        default: () => ({})
      }
    })
  ],
  props: {
    option: {
      default: () => ({})
    },
    disabled: Boolean,
    size: {
      default: 'mini'
    },
    type: {
      default: 'text'
    },
    icon: {
      default: 'el-icon-plus'
    },
    text: {
      default: '新增产品'
    },

    resetOnSubmit: {
      default: true
    }
  },
  data() {
    return {
      visible: false
    }
  },
  computed: {
    finalOption({ option }) {
      option = cloneDeep(option)
      option.isSearch = validData(option.isSearch, false)
      option.labelSuffix = validData(option.labelSuffix, false)
      option.size = validData(option.size, 'large')
      option.menuBtn = validData(option.menuBtn, true)
      option.column.forEach(column => {
        column.size = validData(column.size, option.size)
      })
      return option
    },
    defaultForm() {
      let tempObj = {}
      this.finalOption.column.forEach(column => {
        if (!validatenull(column.value)) {
          tempObj[column.prop] = column.value
        }
      })
      return tempObj
    }
  },
  methods: {
    onsubmit(form, done) {
      this.oninput()
      this.$emit('submit', this.curValue, () => {
        this.visible = false
        done()
      })
      !this.$listeners.submit && (this.visible = false)

      if (this.resetOnSubmit) {
        this.resetForm()
      }
    },
    oninput(value = this.curValue) {
      this.$emit('input', value)
    },
    resetForm() {
      this.curValue = cloneDeep(this.defaultForm)
      this.oninput()
      this.$refs.form.clearValidate()
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep.popover-form {
  padding: 18px 20px;

  .el-form-item {
    margin-bottom: 20px;
  }
  .form-menu-wrapper {

    .el-form-item {
      margin-bottom: 0;
    }
    .form-menu {
      line-height: 28px;
      text-align: right;
    }
    .el-button {
      height: 28px;
      padding: 0 15px;
      font-size: 14px;
    }
  }
}
</style>
