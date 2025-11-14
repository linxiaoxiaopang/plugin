<template>
  <span class="table-operation text-cut">
    <div
      v-for="item in outerList"
      :key="item.value"
      class="menu-btn-item text-primary cursor-pointer"
      @click="$emit('command', item.value)"
    >
      <slot :name="item.value">
        <vnodes v-if="item.vnode" :vnodes="item.vnode"></vnodes>
        <el-button v-else type="text">{{ item.label }}</el-button>
      </slot>
    </div>
    <customDropdown
      v-if="innerList.length"
      placement="bottom"
      class="menu-btn-item"
      :dropdown-menu-class="dropdownMenuClass"
      :list="innerList"
      :trigger="trigger"
      v-bind="$attrs"
      v-on="$listeners"
    >
      <span class="dropdown-trigger">
        <slot name="dropdownTrigger">
          <i class="el-icon-more"></i>
        </slot>
      </span>
      <template v-for="item in innerList" #[item.value]>
        <vnodes v-if="item.vnode" :vnodes="item.vnode"></vnodes>
        <slot v-else :ref="item.value" :name="item.value"></slot>
      </template>
    </customDropdown>
  </span>
</template>

<script>
import customDropdown from '@/views/components/base/customDropdown'
import { validatenull } from '@/components/avue/utils/validate'

export default {
  components: {
    Vnodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes
    },
    customDropdown
  },
  props: {
    trigger: {
      default: 'click'
    },
    list: {
      type: Array,
      default: () => []
    },
    // 最大展示个数
    outerMaxSize: {
      default: 4
    }
  },
  data() {
    return {
      new$Slots: this.$slots
    }
  },
  computed: {
    slots({ new$Slots: $slots }) {
      // value 个数总计，从0开始。防止重复
      let uniqValue = {
        // default 为默认插槽，即已经被使用
        default: 0,
        // dropdownTrigger 为 customDropdown 触发器，即已经被使用
        dropdownTrigger: 0
      }
      let tempArr = []
      for (const slotName in $slots) {
        // dropdownTrigger 为 customDropdown 触发器
        if (['dropdownTrigger'].includes(slotName)) continue
        $slots[slotName].forEach((vnode) => {
          let { data: { attrs: { triggerName } = {} } = {}, tag } = vnode
          if (!tag) return
          let value = triggerName || tag.split('-').pop()

          // 如果 value 已存在 value = `${value}-1`
          if (uniqValue[value] !== undefined) {
            value = `${value}-${++uniqValue[value]}`
          } else {
            uniqValue[value] = 0
          }

          tempArr.push({
            label: value,
            value,
            vnode: slotName === 'default' ? vnode : undefined
          })
        })
      }
      return tempArr
    },
    finalList({ list, slots }) {
      return validatenull(list) ? slots : list
    },
    // 超过最大展示个数，则显示下拉菜单
    isOverflow({ finalList, outerMaxSize }) {
      return finalList.length > outerMaxSize
    },
    finalOuterSize() {
      return this.outerMaxSize - (this.isOverflow ? 1 : 0)
    },
    outerList() {
      return this.finalList.slice(0, this.finalOuterSize)
    },
    innerList() {
      return this.finalList.slice(this.finalOuterSize)
    },

    dropdownMenuClass() {
      return `${this.$attrs['dropdown-menu-class']} table-operation-dropdown`
    }
  },
  beforeUpdate() {
    this.new$Slots = this.$slots
  }
}
</script>

<style lang="scss" scoped>
.table-operation {
  .menu-btn-item {
    display: inline-block;

    $ml: 14px;
    + .menu-btn-item {
      position: relative;
      margin-left: $ml;
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: -($ml / 2);
        width: 1px;
        height: calc(1em - 2px);
        background-color: #dcdfe6;
      }
    }
    .el-button,
    &.el-button {
      margin-right: 0;
    }

    > * {
      display: inline-block;
    }
  }

  .dropdown-trigger {
    color: $color-primary;
    cursor: pointer;

    .el-icon-more {
      background-color: transparent;
    }
  }

  ::v-deep {
    .el-button,
    .fontStyle {
      width: auto !important;
      color: $color-primary;
    }
  }
}
.el-popper.custom-dropdown-menu.table-operation-dropdown ::v-deep {
  padding: 4px 0 0;
  .el-dropdown-menu__item {
    min-width: 84px;
    line-height: 28px;
    margin-bottom: 4px;
    padding: 0;
    text-align: center;

    > * {
      display: block !important;
      width: 100% !important;
      padding: 0 20px;
    }
  }
  .popper__arrow {
    display: block;
  }

  .el-button,
  .fontStyle {
    width: 100% !important;
    color: $color-title;
  }
  .el-button {
    padding: 0;
    line-height: 28px;
    border: none;
  }
  .line,
  .inline-block {
    display: block;
  }
}
</style>
