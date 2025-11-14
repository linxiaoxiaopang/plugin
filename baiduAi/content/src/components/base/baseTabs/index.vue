<template>
  <div class="base-tabs" :class="{ [`base-tabs--${option.type}`]: option.type }">
    <el-radio-group
      v-if="['border', 'borderLight', 'borderText', 'add', 'step'].includes(option.type)"
      :class="{ 'list-state-group': ['border', 'borderLight'].includes(option.type) }"
      v-model="curValue"
      @change="handleTabClick"
    >
      <el-radio-button
        v-for="({ label, value, prefixIcon, isAutoWidth, type, dicData, disabled, readonly }, index) in option.column"
        :label="form[value] || value"
        :key="index"
        :class="[
          'base-tab-item',
          `tab--${value}`,
          {
            [`tab--${type}`]: type,
            'is-input': type,
            'is-finish': form.step >= index
          }
        ]"
        :disabled="disabled"
        @click.native="beforeChange(value, curValue, $event, index, readonly)"
      >
        <component
          v-if="type"
          popper-class="base-tab-item-popper"
          :is="getComponent(type)"
          v-model="form[value]"
          :defaultValue="defaultValue"
          :dic="dicData"
          :clearable="false"
          :isAutoWidth="isAutoWidth"
          @click.native="handleInputClick(form[value])"
          @input="handleInputClick(form[value])"
        ></component>
        <template v-else>
          <customIcon v-if="prefixIcon" :icon="prefixIcon"></customIcon>
          {{ label }}
        </template>
      </el-radio-button>
    </el-radio-group>
    <el-tabs
      v-else
      :type="option.type === 'normal' ? '' : option.type"
      :class="{ [`base-tabs--${option.type}`]: option.type }"
      v-model="curValue"
      @tab-click="handleTabClick"
    >
      <el-tab-pane
        v-for="item in option.column"
        :key="item.value"
        :label="item.label"
        :name="item.value"
      >
        <template #label>
          <div v-if="validFn([item.edit, option.edit], item)" class="flex-center-between">
            <div
              class="tabs-input-text"
              :contentEditable="contentEditable[item.value]"
              @blur="editChange(item, $event)"
              @keydown.enter.prevent
            >{{ item.label }}</div>
            <i v-show="!contentEditable[item.value]" class="el-icon-edit el-icon--right text-primary" @click="editClick(item, $event)"></i>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>

    <baseTabs
      v-if="children"
      :key="curValue"
      v-model="childValue"
      :dic="children"
      @change="handleChange"
      @tab-click="handleTabClick"
    ></baseTabs>

    <div v-if="hasContent" class="base-tabs__content">
      <el-tabs
        v-model="curValue"
        class="hide-header"
        @tab-click="handleTabClick"
      >
        <el-tab-pane
          v-for="item in option.column"
          :key="item.value"
          :label="item.label"
          :name="item.value"
          :lazy="lazy"
        >
          <slot :name="item.value" :column="item">
            <slot :column="item">
              <component v-if="item.name" :is="item.name" :column="item" v-bind="item.attrs"></component>
            </slot>
          </slot>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { find } from 'lodash'
import { validData, getComponent, validFn } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'
import { getTabsOption } from './util'
import { debounce } from '@/utils'

export default {
  name: 'baseTabs',
  props: {
    value: {
      default: ''
    },
    dic: {
      type: Array | Object,
      default: () => {
        return []
      }
    },
    showAllLevels: {
      type: Boolean,
      default: true
    },
    // card|border-card|border|borderLight|borderText|add|text|normal|step
    type: {
      default: 'border'
    },
    lazy: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      curValue: '',
      childValue: [],
      form: {},
      contentEditable: {}
    }
  },
  computed: {
    finalValue: {
      get({ curValue, childValue }) {
        return [curValue].concat(childValue)
      },
      set(value) {
        value = Array.isArray(value) ? value : []
        this.curValue = value[0] ?? this.defaultValue
        this.childValue = value.slice(1)
      }
    },
    defaultValue({ option: { defaultValue, column } }) {
      return validData(defaultValue, column[0]?.value)
    },
    option({ dic, type }) {
      let option = getTabsOption(dic)
      option.type = validData(option.type, type)
      return option
    },
    curItem({ option: { column }, curValue }) {
      return find(column, { value: curValue }) || {}
    },
    children({ curItem }) {
      return curItem.children
    },

    hasContent({ option: { column }, $scopedSlots }) {
      let hasContent = !!$scopedSlots.default
      column.forEach(item => {
        if (item.name || $scopedSlots[item.value]) hasContent = true
      })
      return hasContent
    }
  },
  watch: {
    defaultValue: {
      handler(defaultValue) {
        // value无值或值不是tab的value时，设置为默认值
        if (!validatenull(this.value) && this.isColumnValue(this.option, this.value)) return

        this.curValue = defaultValue
        this.handleChange()
        this.defaultValueLock = true
        this.$nextTick(function () {
          this.defaultValueLock = false
        })
      },
      immediate: true
    },
    children: {
      handler(n) {
        if (!this.isColumnValue(n, this.childValue)) this.childValue = []
      },
      immediate: true
    },
    value: {
      handler(value) {
        // value无值时，设置为默认值
        if (validatenull(value) && this.defaultValueLock) return
        this.finalValue = this.showAllLevels ? value : [value]
      },
      immediate: true,
      deep: true
    },
    option: {
      handler(n, o) {
        n.column?.forEach(item => {
          if (item.type) {
            this.$set(this.form, item.value, item.dicData[0].value)
          }
        })

        if (n.type === 'step') {
          this.$set(this.form, 'step', n.step || 0)
        }

        if (this.defaultValueLock) return
        const nColumn = n?.column?.filter(ele => ele.value !== 'add')
        const oColumn = o?.column?.filter(ele => ele.value !== 'add')
        if (!validatenull(nColumn) && validatenull(oColumn)) {
          this.setValueOnDicChange()
        }
      },
      immediate: true
    }
  },
  methods: {
    validFn,
    validData,
    getComponent,
    handleTabClick() {
      // console.log(this.curValue, 'handleTabClick')
      let { finalValue } = this

      // 如果有children，就由子组件触发change
      validatenull(this.children) && this.handleChange(finalValue)

      this.$emit('tab-click', finalValue)
    },
    handleInputClick(value) {
      const { curValue } = this
      if (curValue !== value && !validatenull(value)) {
        this.curValue = value
        this.handleTabClick()
      }
    },
    handleChange() {
      // console.log(this.curValue, 'handleChange')
      let { finalValue } = this
      finalValue = this.showAllLevels ? finalValue : finalValue.slice(-1)[0]
      this.$emit('input', finalValue)
      this.$emit('change', finalValue)
      this.$emit('search-change', finalValue)
    },
    async beforeChange(n, o, ev, index, readonly) {
      this.onclick(ev, index)

      const noClick = this.option.type === 'step'
      let { beforeChange } = this.$attrs
      if (typeof beforeChange === 'function' || (noClick && this.form.step < index) || readonly) {
        ev.preventDefault && ev.preventDefault()
        ev.stopPropagation ? ev.stopPropagation() : ev.cancelBubble = true

        if (noClick || readonly) return

        if (await beforeChange(n, o)) {
          this.curValue = n
          this.handleTabClick(n)
        }
      }
    },
    onclick: debounce(
      function (ev, index) {
        this.$emit('click', ev, this.option.column[index])
      },
      200,
      true
    ),

    editClick(item, e) {
      this.$set(this.contentEditable, item.value, true)

      this.$nextTick(() => {
        const node = e.target.previousElementSibling
        node.focus()
        this.setEndOfContentEditable(node)
      })
    },
    editChange(item, e) {
      item.label = e.target.textContent
      this.$delete(this.contentEditable, item.value)
    },
    setEndOfContentEditable(contentEditableElement) {
      let range, selection;
      range = document.createRange();
      range.selectNodeContents(contentEditableElement);
      range.collapse(false);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },

    isColumnValue(option, value) {
      const { column } = getTabsOption(option) || {}
      return !!find(column, { value: [].concat(value)[0] })
    },

    setValueOnDicChange() {
      // console.log(this.curValue, 'created')
      // 立即执行一次change，为了设置默认值
      let isFirst = true
      let unwatch
      unwatch = this.$watch(
        'finalValue',
        (finalValue) => {
          // console.log(this.curValue, finalValue)
          typeof unwatch === 'function' && unwatch()
          // 如果有children，就由子组件触发change
          if (!this.children && isFirst) {
            isFirst = false
            this.handleChange(finalValue)
          }
        },
        {
          immediate: true
        }
      )
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  $height: 40px;
  &.base-tabs {
    width: 100%;
  }

  &.base-tabs--text {
    .el-tabs__nav-wrap::after {
      display: none;
    }

    .el-tabs__header {
      margin-bottom: 0;
    }

    .el-tabs__item {
      height: 1em;
      line-height: 1;
      padding: 0;
      font-size: 16px;

      + .el-tabs__item {
        padding-left: 40px;
      }
    }
  }

  &.base-tabs--add {
    .el-radio-button__orig-radio:checked+.el-radio-button__inner {
      color: $color-primary;
      background-color: #FFF;
      border-color: #DCDFE6;
      box-shadow: none;
    }
    .el-radio-button.add .el-radio-button__inner {
      color: #FFF;
      background-color: #3841DB;
      border-color: #3841DB;
    }
  }

  &.base-tabs--border {
    .el-radio-button {
      &:first-child .el-radio-button__inner {
        border-bottom-left-radius: 0;
      }
      &:last-child .el-radio-button__inner {
        border-bottom-right-radius: 0;
      }
    }
    .el-radio-button__orig-radio:checked+.el-radio-button__inner {
      color: #FFF;
      background-color: $color-content;
      border-color: $color-content;
      box-shadow: -1px 0 0 0 $color-content;
      .el-input__inner {
        border-color: $color-content;
      }
    }
    .el-radio-button__inner {
      height: $height;
      line-height: $height;
      padding: 0 28px;
      &:hover {
        @include hoverPrimary;
        .el-input__inner {
          @include hoverPrimary;
        }
      }
    }

    .base-tab-item {
      &.is-input {
        .el-radio-button__inner {
          padding: 0;
          border: none;
        }
        .el-select,
        .el-input {
          height: $height;
        }
        .el-input__inner {
          padding: 0 46px 0 28px;
          border-left: none;
          border-color: #E2E2E2;
          background-color: transparent;
          border-radius: 0;
          &:hover {
            color: $color-primary;
          }
        }
        .el-select {
          .el-input__inner,
          .el-input__suffix .el-select__caret {
            line-height: 40px;
          }
          .el-input__suffix {
            right: 21px;
          }
        }
        &.is-active {
          .el-input__inner,
          .el-input__suffix .el-select__caret {
            color: #FFFFFF;
          }
        }
      }
    }
  }
  &.base-tabs--borderText,
  &.base-tabs--borderLight {
    .el-radio-button {
      &:first-child .el-radio-button__inner {
        border-bottom-left-radius: 0;
      }
      &:last-child .el-radio-button__inner {
        border-bottom-right-radius: 0;
      }
    }
    .el-radio-button__orig-radio:checked+.el-radio-button__inner {
      color: $color-primary;
      //background-color: $color-content;
      //border-color: $color-content;
      //box-shadow: -1px 0 0 0 $color-content;
      //.el-input__inner {
      //  border-color: $color-content;
      //}
    }
    .el-radio-button__inner {
      height: $height;
      line-height: $height;
      padding: 0 28px;
      &:hover {
        @include hoverPrimary;
        .el-input__inner {
          @include hoverPrimary;
        }
      }
    }

    .base-tab-item {
      &.is-input {
        .el-radio-button__inner {
          padding: 0;
          border: none;
        }
        .el-select,
        .el-input {
          height: $height;
        }
        .el-input__inner {
          padding: 0 46px 0 28px;
          border-left: none;
          border-color: #E2E2E2;
          background-color: transparent;
          border-radius: 0;
          &:hover {
            color: $color-primary;
          }
        }
        .el-select {
          .el-input__inner,
          .el-input__suffix .el-select__caret {
            line-height: 40px;
          }
          .el-input__suffix {
            right: 21px;
          }
        }
        &.is-active {
          .el-input__inner,
          .el-input__suffix .el-select__caret {
            color: #FFFFFF;
          }
        }
      }
    }
  }
  &.base-tabs--borderText {
    .el-radio-button__orig-radio:checked+.el-radio-button__inner {
      background-color: transparent;
    }
    .el-radio-button__inner:hover {
      background-color: transparent;
    }
  }

  &.base-tabs--normal {
    .el-tabs__header {
      margin: 0;
    }
  }

  &.base-tabs--step {
    $height: 30px;
    $pl: 20px;
    .el-radio-button + .el-radio-button {
      margin-left: 15px;
    }
    .el-radio-button__orig-radio:checked+.el-radio-button__inner {
      box-shadow:none;
    }
    .el-radio-button__inner {
      position: relative;
      min-width: 220px;
      height: $height;
      line-height: $height;
      padding: 0 0 0 $pl;
      margin-right: $pl;
      color: $color-content;
      background-color: $border-color;
      border: none;
      border-radius: 0;
      &::after {
        content: '';
        position: absolute;
        right: -$pl;
        @include triangle($pl, $height, left);
        color: $border-color;
        transition: .3s;
      }
    }

    .is-finish {
      .el-radio-button__inner {
        color: #FFF;
        background-color: $color-content;
        &::after {
          color: $color-content;
        }
      }
    }
    .is-active {
      .el-radio-button__inner {
        text-decoration: underline;
      }
    }
  }

  .el-radio-button:focus:not(.is-focus):not(:active):not(.is-disabled) {
    box-shadow: none;
    border-left-color: #dcdee0;
  }

  .el-radio-group {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }
  .base-tabs__content {
    margin-top: 18px;
  }
  .hide-header {
    .el-tabs__header {
      display: none;
    }
  }
}
</style>
<style lang="scss">
.base-tab-item-popper.el-popper[x-placement^=bottom] {
  margin-top: 0;
  border-radius: 0;
  box-shadow: 0px 2px 7px 0px rgba(73,73,73,0.2000);

  .popper__arrow {
    display: none;
  }

  .el-select-dropdown__list {
    padding: 0;
  }
  .el-select-dropdown__wrap {
    max-height: none;
  }
  .el-select-dropdown__item {
    height: 40px;
    line-height: 40px;
    padding: 0 28px;
    &.hover,
    &:hover {
      background: rgba(53,105,253,0.0600);
    }
  }

  .el-select-group__wrap:not(:last-of-type) {
    padding-bottom: 0;
    &::after {
      bottom: 0;
    }
  }
  .el-scrollbar__wrap {
    margin-bottom: -12px !important;
  }
}
</style>