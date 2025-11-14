<template>
  <el-dialog
    v-el-drag-dialog
    :visible.sync="dialogVisible"
    v-bind="dialogProps"
    @closed="closed"
  >
    <template v-if="dialogAttrs.titleIcon" #title>
      <svg-icon :icon-class="dialogAttrs.titleIcon"/>
      <span class="el-dialog__title" style="margin-left: 8px;">{{ dialogAttrs.title }}</span>
    </template>
    <callbackComponent
      v-for="(item, index) in components"
      :key="index"
      ref="components"
      :component="item.componentAttrs.is || item.component"
      v-model="form"
      :valueResolve="valueResolve"
      :dialogClose="closed"
      v-bind="item.componentAttrs"
    ></callbackComponent>
    <template v-if="hasFooter" #footer>
      <el-button class="text-small" @click="oncancel">{{ cancelText }}</el-button>
      <loadingBtn class="text-small" type="primary" @click="onsubmit">{{ confirmText }}</loadingBtn>
    </template>
  </el-dialog>
</template>

<script>
import callbackComponent from '@/views/components/callbackComponent'

export default {
  components: {
    callbackComponent
  },
  data() {
    return {
      dialogAttrs: {},
      dialogVisible: false,
      hasFooter: true,
      cancelText: '取消',
      confirmText: '确定',
      form: {},
      
      component: '',
      componentAttrs: {}
    }
  },
  computed: {
    dialogProps({ dialogAttrs }) {
      return {
        width: '600px',
        appendToBody: true,
        ...dialogAttrs,
        customClass: `extend-dialog dialog-header-border ${dialogAttrs.customClass}`
      }
    },
    components({ component, componentAttrs }) {
      return Array.isArray(component) ? component : [{
        component,
        componentAttrs
      }]
    }
  },
  methods: {
    async onsubmit() {
      let valid = await this.validate()
      if (!valid) return
      
      let { form, callback } = this
      form.$target = 'confirm'
      if (typeof callback === 'function') {
        await callback(form, this.hide)
      } else {
        this.hide()
      }
    },
    hide() {
      this.valueResolve(this.form)
      this.closed()
    },
    async validate() {
      // console.log(this.$refs.components)
      let p = this.$refs.components?.map(async component => {
        // 不是vue组件（dom元素）
        if (component.isNativeDom()) return true
        
        let validate = component.$attrs.validate ? (() => component.$attrs.validate(this.form)) : component.validate
        // console.log(component, validate)
        return typeof validate === 'function' ? validate() : true
      })
      
      let valid = await promiseAll(p)
      console.log(valid)
      return valid.every(Boolean)
    },
    oncancel() {
      this.valueResolve('cancel')
      this.closed()
    },
    
    onchange(val) {
      this.dialogVisible = false
      this.valueResolve(val)
    },
    open() {
      this.dialogVisible = true
    },
    closed() {
      this.handleDestroy()
    }
  }
}
</script>

<style lang="scss">
.extend-dialog {
  .svg-icon {
    position: relative;
    top: 2px;
    font-size: 18px;
  }
  
  .el-table,
  &.el-table {
    border-top: 1px solid $border-color;
    border-left: 1px solid $border-color;
    th {
      border-right: 1px solid #EBEEF5;
    }
  }
  
  .el-dialog__footer {
    padding-bottom: 30px;
    .el-button {
      margin: 0 0 0 8px;
      border-radius: 2px;
      &.el-button--default {
        color: #1A1A1A;
      }
    }
  }
}
</style>
