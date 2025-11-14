<template>
  <el-dropdown
    ref="dropdown"
    class="input-select-dropdown"
    placement="bottom-start"
    trigger="click"
    @command="handleSelectChange"
    @visible-change="handleVisibleChange"
  >
    <el-input
      v-model="text"
      :size="size"
      :placeholder="finalPlaceholder"
      :disabled="disabled || readonly"
      :clearable="clearable"
      @keyup.enter.native="searchChange"
      @clear="handleClear"
      @focus="onfocus"
      @blur="onblur"
      v-on="$listeners"
    ></el-input>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        v-for="(item, index) in dic"
        :key="index"
        :command="index"
        :disabled="item.disabled"
        :class="{ active: selected === index }"
      >{{ item[dictLabel] }}</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

export default {
  name: 'InputSelect',
  props: {
    label: {
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
    }
  },
  data() {
    return {
      text: '',
      selected: '',
      dropdownDisabled: true
    }
  },
  computed: {
    dictLabel() {
      return this.props.label || 'label'
    },
    dictValue() {
      return this.props.value || 'value'
    },

    finalPlaceholder() {
      return this.placeholder || '请选择' + this.label
    }
  },
  watch: {
    value: {
      handler(n) {
        this.text = n
      },
      immediate: true
    },
  },
  methods: {
    oninput(value) {
      this.text = value
      this.$emit('input', value)
    },
    searchChange() {
      this.$emit('search-change', this.text)
    },

    handleClear() {
      // this.$refs.dropdown.hide()
      this.searchChange()
    },
    onfocus() {
      // this.dropdownDisabled = false
      // this.$refs.dropdown.show()
    },
    onblur() {
      // this.dropdownDisabled = true
      // this.$refs.dropdown.hide()
    },
    handleSelectChange(index) {
      this.selected = index
      this.oninput(this.dic[index][this.dictValue])
    },
    handleVisibleChange() {
      this.$refs.dropdown.dropdownElm.style.width = `${this.$refs.dropdown.triggerElm.offsetWidth}px`
    }
  }
}
</script>

<style lang="scss" scoped>
.input-select-dropdown {
  width: 100%;
}
::v-deep {
  .el-dropdown-menu__item.active {
    color: $color-primary;
  }
}
</style>
