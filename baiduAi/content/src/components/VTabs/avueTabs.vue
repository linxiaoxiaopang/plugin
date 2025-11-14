<template>
  <div :class="b()">
    <el-tabs
      v-model="active"
      :tab-position="parentOption.position"
      :type="parentOption.type"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        v-for="(column,index) in columnOption"
        :key="index"
        :name="index+''"
        :disabled="column.disabled"
      >
        <template #label>
          <slot name="label" :column="column" :props="finalProps" :index="index">
            <el-checkbox
              v-if="option.checkbox"
              v-model="checked"
              :label="column[dictValue]"
              class="tabs-checkbox"
              @click.native.stop
              @change="handleCheckboxChange"
            />
            <span v-if="column[dictIcon]">
              <i :class="column[dictIcon]"></i>&nbsp;
              {{column[dictLabel]}}
            </span>
            <span v-else>{{column[dictLabel]}}</span>
          </slot>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import create from '@/components/avue/core/create'
import props from '@/mixins/dic/props'
import { findIndex, get, isEqual, uniq } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export default create({
  name: 'tabs',
  inheritAttrs: false,
  mixins: [props],
  props: {
    value: {},
    option: {
      type: Object,
      required: true,
      default: () => {
        return {}
      }
    }
  },
  data () {
    return {
      active: '',
      checked: []
    }
  },
  computed: {
    tabsObj() {
      return this.columnOption[this.active]
    },
    parentOption() {
      return this.option
    },
    columnOption() {
      return this.parentOption.column || []
    },
    objectOption({ dictValue }) {
      let tempObj = {}
      this.columnOption.forEach((column) => {
        tempObj[column[dictValue]] = column
      })
      return tempObj
    },

    dictIcon() {
      return this.finalProps.icon || 'icon'
    },

    defaultCheckboxValue({ parentOption: { defaultCheckboxValue } }) {
      return validatenull(defaultCheckboxValue) ? get(this.columnOption, [0, this.dictValue]) : defaultCheckboxValue
    }
  },
  watch: {
    value: {
      handler(n) {
        this.setValue(n)
      },
      immediate: true
    },
    active() {
      this.$emit('change', this.tabsObj)
    },

    columnOption: {
      handler(n, o) {
        if (!isEqual(n, o)) this.checked = []
      },
      immediate: true
    },
    defaultCheckboxValue: {
      handler(n) {
        if (!validatenull(n)) {
          this.checked = uniq(this.checked.concat(n))
          this.handleCheckboxChange()
        }
      },
      immediate: true
    }
  },
  methods: {
    handleInput() {
      this.$emit('input', this.tabsObj?.[this.dictValue])
    },
    handleTabClick() {
      this.handleInput()
      this.$emit('tab-click', this.tabsObj)
    },

    changeTabs (value) {
      this.setValue(value)
      this.handleInput()
    },
    setValue(value) {
      let index = findIndex(this.columnOption, { [this.dictValue]: value })
      if (index < 0) index = 0
      this.active = index+''
    },

    handleCheckboxChange() {
      this.$emit('update:checked', this.checked)

      const checkList = this.checked.map(item => this.objectOption[item])
      this.$emit('update:checkList', checkList)
      this.$emit('checkbox-change', checkList)
    }
  }
})
</script>

<style lang="scss" scoped>
::v-deep {
  .el-tabs__header {
    margin-bottom: 0;
  }
  .tabs-checkbox {
    line-height: 1;
    margin-right: 8px;
    .el-checkbox__label {
      display: none;
    }
  }
}
</style>