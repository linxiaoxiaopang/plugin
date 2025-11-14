<template>
  <appDialog
    :beforeCancel="prev"
    :beforeSubmit="next"
    v-bind="dialogAttrs"
    v-on="dialogListeners"
  >
    <template v-for="(val, key) in $scopedSlots" v-slot:[key]="scope">
      <slot :name="key" v-bind="scope"></slot>
    </template>

    <slot>
      <slot name="before">
        <slot :name="`${active}Before`"></slot>
      </slot>
      <template v-for="item in columnOption">
        <keepExist :show="active === item.value" :prop="item.value" :include="finalInclude" :exclude="finalExclude" :isWrapper="item.isWrapper">
          <slot :name="item.value">
            <component
              v-if="item.component"
              :ref="item.value"
              :is="item.component"
              :model="model"
              @input="itemInput(item, $event)"
              v-bind="getComponentAttrs(item)"
              v-on="getComponentListeners(item)"
            />
          </slot>
        </keepExist>
      </template>
      <slot name="after">
        <slot :name="`${active}After`"></slot>
      </slot>
    </slot>
  </appDialog>
</template>

<script>
import keepExist from '@/components/keepExist'
import { findIndex, isArray } from 'lodash'
import { getResult } from '@/utils/functional'
import { validatePipe } from '@/components/avue/utils/validate'

export default {
  components: {
    keepExist
  },

  props: {
    value: {},
    model: {
      type: Object,
      default: () => ({})
    },
    option: {
      type: Object | Array,
      default: () => ([])
    },
    beforePrev: Function,
    beforeNext: Function,
    beforeSubmit: Function,
    componentAttrs: {
      type: Object,
      default: () => ({})
    },
    componentListeners: {
      type: Object,
      default: () => ({})
    },
    include: Array,
    exclude: Array
  },

  data() {
    return {
      activeIndex: 0
    }
  },

  computed: {
    isLast() {
      return this.activeIndex === this.columnOption.length - 1
    },

    columnOption() {
      return this.finalOption.column
    },
    finalOption({ option }) {
      if (isArray(option)) option = { column: option }
      return option
    },
    active() {
      return this.curItem.value
    },
    curItem() {
      return {
        ...this.finalOption,
        ...(this.columnOption[this.activeIndex] || {})
      }
    },
    stepOption({ activeIndex }) {
      return {
        dialogAttrs: {
          isDestroyOnClose: true,
          cancelBtn: activeIndex !== 0,
          cancelText: '上一步',
          confirmText: this.isLast ? '确定' : '下一步'
        }
      }
    },
    dialogAttrs() {
      return {
        ...this.stepOption.dialogAttrs,
        ...this.$attrs,
        ...(getResult(this.finalOption.dialogAttrs) || {}),
        ...(getResult(this.curItem.dialogAttrs) || {})
      }
    },
    dialogListeners() {
      return {
        ...this.$listeners,
        ...(this.finalOption.dialogListeners || {}),
        ...(this.curItem.dialogListeners || {}),
        submit: this.onsubmit
      }
    },

    getComponentAttrs() {
      const result = {
        ...this.componentAttrs,
        ...getResult(this.finalOption.attrs)
      }
      return (item) => {
        return {
          ...result,
          ...getResult(item.attrs)
        }
      }
    },
    getComponentListeners() {
      const result = {
        ...this.componentListeners,
        ...(this.finalOption.listeners || {})
      }
      return (item) => {
        return {
          ...result,
          ...(item.listeners || {})
        }
      }
    },

    finalInclude() {
      return this.finalOption.include || this.include
    },
    finalExclude() {
      return this.finalOption.exclude || this.exclude
    }
  },

  watch: {
    value: {
      handler(n) {
        const index = findIndex(this.columnOption, { value: n })
        if (index < 0) {
          this.activeIndex = 0
          this.oninput()
        } else {
          this.activeIndex = index
        }
      },
      immediate: true
    }
  },

  methods: {
    onsubmit(form, done) {
      if (!this.$listeners.submit) return done()

      this.$emit('submit', this.getParams(), done)
    },
    getParams() {
      const { model } = this
      const form = {}
      for (const item of this.columnOption) {
        const itemRef = this.getItemRef(item.value)
        const params = itemRef.getParams ? getResult(itemRef.getParams) : model[item.value]
        if (params) form[item.value] = params
      }
      return form
    },

    next() {
      const { curItem } = this
      const itemRef = this.getItemRef(curItem.value)
      return validatePipe(
        itemRef.beforeNext || curItem.beforeNext || this.beforeNext,
        () => {
          if (this.isLast) {
            return validatePipe(
              this.beforeSubmit
            )
          }

          this.activeIndex++
          this.oninput()
        }
      )
    },
    prev() {
      const { curItem } = this
      const itemRef = this.getItemRef(curItem.value)
      return validatePipe(
        itemRef.beforePrev || curItem.beforePrev || this.beforePrev,
        () => {
          if (this.activeIndex !== 0) {
            this.activeIndex--
            this.oninput()
          } else {
            return true
          }
        }
      )
    },

    oninput() {
      this.$emit('input', this.active)
    },

    itemInput(item, value) {
      this.model[item.value] = value
    },

    getItemRef(value) {
      return this.$refs[value]?.[0] || {}
    },

    getResult
  }
}
</script>
