<template functional>
  <el-dropdown
    v-dropdown-menu-hover="props.hoverClass || ['global-dom-dropdown_enter', 'global-dom-dropdown-btn_active']"
    class="custom-dropdown"
    :trigger="props.trigger"
    :placement="props.placement || 'bottom-start'"
    :class="data.staticClass"
    v-on="listeners"
  >
    <slot>
      <!-- <el-button plain icon="el-icon-more"></el-button> -->
      <div class="opacity el-button">
        <i class="el-icon-more main-color" v-if="props.preventStop" @click.prevent.stop> </i>
        <i class="el-icon-more main-color" v-else> </i>
      </div>
    </slot>
    <el-dropdown-menu slot="dropdown" class="custom-dropdown-menu" :class="props.dropdownMenuClass">
      <el-dropdown-item
        v-for="item in props.list"
        :key="item.value"
        :command="item.value"
        :class="`custom-dropdown-${item.value}`"
      >
        <slot :name="item.value">
          <div v-if="item.prefix" class="dropdown-icon-wrapper">
            <customIcon v-bind="parent.getCustomIconAttrs(item.prefix)"></customIcon>
          </div>
          {{ item.label
          }}<slot :name="`suffix-${item.value}`">
            <customIcon v-if="item.suffix" v-bind="parent.getCustomIconAttrs(item.suffix)"></customIcon>
          </slot>
        </slot>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.custom-dropdown {
  .el-button.el-button.el-button {
    width: 24px;
    height: 24px;
    padding: 0;
    margin: 0;
    border: none;
  }
}
.opacity {
  width: 24px;
  height: 24px;
  line-height: 24px;
  background: rgba(43, 43, 43, 0.7);
  border-radius: 50%;
  i {
    color: #fff;
  }
  .main-color {
    font-size: 13px;
    position: relative;
    top: 0;
  }
}
.el-popper.custom-dropdown-menu ::v-deep {
  .popper__arrow {
    display: none;
  }
}
</style>
