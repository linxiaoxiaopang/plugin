<template>
  <div v-show="getBtnName() || btnOptions.hasBtn" class="extend-dialog-wrapper">
    <span v-if="getBtnName()" class="extend-dialog-btn" :class="{ 'is-disabled': disabled }">
      <component :is="getBtnName()" :disabled="disabled" :loading="btnLoading" :uiid="uiid" v-bind="btnOptions" @click="onclick"></component>
    </span>
    <span v-else-if="btnOptions.hasBtn" class="extend-dialog-btn" :class="{ 'is-disabled': disabled }" :uiid="uiid" @click="onclick">
      <slot name="reference">
        <base-button :disabled="disabled" :loading="btnLoading" v-bind="btnOptions">{{ btnOptions.text }}</base-button>
      </slot>
    </span>
    <component
      ref="dialog"
      v-if="showDialog"
      v-loading="dialogLoading"
      v-el-drag-dialog="dialogOptions.drag && dialogOptions.dialogType === 'elDialog'"
      v-style="dialogOptions"
      :is="dialogOptions.dialogType"
      :class="{ 'vertical-center': verticalCenter, 'is-resize': isResize }"
      :visible.sync="dialogVisible"
      :uiid="`${uiid}-dialog`"
      v-bind="dialogOptions"
      @open="doOpen"
      @opened="doOpened"
      @close="doClose"
      @closed="doClosed"
      @hook:created="onDialogCreated"
      @hook:destroyed="dialogCreated = false"
    >
      <template v-if="dialogOptions.titleIcon || dialogOptions.titleHtml || $scopedSlots.title" #title>
        <customIcon
          v-if="dialogOptions.titleIcon"
          style="margin-right: 8px"
          :option="dialogOptions.titleIcon"
        ></customIcon>
        <span v-if="dialogOptions.titleHtml" class="el-dialog__title" v-html="dialogOptions.titleHtml"></span>
        <span v-else class="el-dialog__title">
          <slot name="title">{{ dialogOptions.title }}</slot>
        </span>
      </template>

      <slot name="bodyHeader"></slot>

      <slot>
        <component
          ref="body"
          :is="getComponentName()"
          :visible.sync="dialogVisible"
          v-bind="bodyOptions"
          v-on="new$listeners"
          @body-input="handleBodyInput"
        >
          <template v-for="(val, key) in $scopedSlots" v-slot:[key]="scope">
            <slot :name="key" v-bind="scope"></slot>
          </template>
        </component>
      </slot>

      <slot name="bodyFooter"></slot>

      <template v-if="dialogOptions.hasFooter" #footer>
        <slot name="beforeFooter"></slot>
        <slot name="footer">
          <base-button v-if="dialogOptions.cancelBtn" :uiid="`${uiid}-cancel`" :size="dialogOptions.cancelSize" @click="oncancel">{{
              dialogOptions.cancelText
            }}</base-button>
          <loadingBtn v-if="dialogOptions.confirmBtn" :uiid="`${uiid}-confirm`" :disabled="confirmDisabled" type="primary" :size="dialogOptions.confirmSize" @click="doSubmit">{{
              dialogOptions.confirmText
            }}</loadingBtn>
        </slot>
        <slot name="afterFooter"></slot>
      </template>
    </component>
  </div>
</template>

<script>
import promise from '@/mixins/dialog/promise'
import { setPx, validData } from '@/components/avue/utils/util'
import { defaultOptions, btnDefaultOptions, dialogProps, btnProps } from './const'

import { upperFirst, cloneDeep } from 'lodash'
import child from '@/components/base/baseTable/mixins/child'
import event from '@/components/base/baseTable/mixins/event'

export default {
  name: 'appDialog',
  inheritAttrs: false,
  components: {
    edit: { render(createElement, context) {} }
  },
  mixins: [
    event('resize'),
    promise,
    child({
      name: 'baseDialog',
      fns: ['dialogClose', 'onclick']
    })
  ],
  props: {
    visible: {
      type: Boolean,
      default: false
    },

    verticalCenter: {
      type: Boolean,
      default: true
    },

    loading: Boolean,
    dialogLoading: Boolean,
    disabled: Boolean,
    btnPlain: Boolean,
    uiid: {
      default: 'zd-appDialog'
    },

    type: {
      default: 'edit'
    },
    value: {
      default: () => ({})
    },
    isDeepValue: {
      type: Boolean,
      default: true
    },

    isOriginData: Boolean,
    isLoadingOnSubmit: {
      type: Boolean,
      default: true
    },
    beforeSubmit: {
      type: Function,
      default: () => true
    },

    beforeOpen: Function,
    beforeCancel: {
      type: Function,
      default: () => true
    },

    confirmDisabled: {
      type: Boolean,
      default: false
    },

    isDestroyOnClose: {
      type: Boolean,
      default: true
    }
  },
  data() {
    const appDialogCreateTime = +new Date()
    const isDialogCreated = () => this.dialogCreated = true
    const distanceTime = 600
    this.onDialogCreated = async () => {
      const diffTime = +new Date() - appDialogCreateTime
      if (diffTime < distanceTime) {
        // const loading = this.$loading({ lock: true })
        await new Promise(resolve => setTimeout(resolve, distanceTime - diffTime))
        // loading.close()
      }
      isDialogCreated()
      this.onDialogCreated = isDialogCreated
    }
    return {
      curType: this.type,
      curValue: this.value,
      isResize: false,

      btnLoading: false,
      // 为了触发open和close事件：dialog要在创建之后打开，在销毁之前关闭
      // created -> open -> close -> destroyed
      closeDialogLock: false, // 只有closeDialogLock为false才能销毁dialog，在closed后closeDialogLock设为false
      dialogVisibleImmediate: false, // dialogVisible的直接值：立即渲染dialog
      dialogCreated: false, // dialogVisible的延迟值：渲染dialog之后，然后再打开dialog

      showDialogForce: false
    }
  },
  computed: {
    showDialog() {
      if (this.showDialogForce) return true
      return this.dialogVisibleImmediate || this.closeDialogLock
    },
    dialogVisible: {
      get() {
        // 为了触发open和close事件：dialog要在创建之后打开，在销毁之前关闭
        // created -> open -> close -> destroyed
        if (this.dialogVisibleImmediate) return this.dialogCreated
        return this.dialogVisibleImmediate
      },
      set(val) {
        this.dialogVisibleImmediate = val
      }
    },

    dialogOptions({ dialogAttrs = {} }) {
      let tempObj = {}
      Object.keys(defaultOptions)
        .concat(dialogProps)
        .forEach((prop) => {
          tempObj[prop] = validData(this.getDialogProp(prop), dialogAttrs[prop], defaultOptions[prop])
        })

      tempObj.customClass = [
        dialogAttrs.customClass,
        defaultOptions.customClass,
        this.customClass,
        this.$attrs.customClass
      ]
        .filter((item) => item && item.trim())
        .join(' ')

      const dialogOptions = {
        ...defaultOptions,
        ...dialogAttrs,
        ...tempObj,
        width: setPx(tempObj.width, dialogAttrs.width, defaultOptions.width),
        height: setPx(this.getDialogProp('height'), dialogAttrs.height, defaultOptions.height),
        maxHeight: setPx(this.getDialogProp('maxHeight'), dialogAttrs.maxHeight, defaultOptions.maxHeight),
        minHeight: setPx(this.getDialogProp('minHeight'), dialogAttrs.minHeight, defaultOptions.minHeight),
        minWidth: setPx(this.getDialogProp('minWidth'), dialogAttrs.minWidth, defaultOptions.minWidth),
        maxWidth: setPx(this.getDialogProp('maxWidth'), dialogAttrs.maxWidth, defaultOptions.maxWidth)
      }
      if (this.verticalCenter) {
        dialogOptions.top = validData(dialogOptions.top, '0')
      }
      if (dialogOptions.height || dialogOptions.maxHeight) {
        dialogOptions.customClass += ' fixed-height'
      }
      if (dialogOptions.maxHeight) {
        dialogOptions.customClass += ' body-flex-one'
      }
      return dialogOptions
    },
    btnOptions({ btnAttrs = {}, btnPlain }) {
      let tempObj = {}
      Object.keys(btnDefaultOptions)
        .concat(btnProps)
        .forEach((prop) => {
          tempObj[prop] = validData(
            this.getDialogProp(`btn${upperFirst(prop)}`),
            btnAttrs[prop],
            btnDefaultOptions[prop]
          )
        })
      return {
        ...btnDefaultOptions,
        ...btnAttrs,
        ...tempObj,
        hasBtn: validData(this.getDialogProp('hasBtn'), tempObj.hasBtn),
        text: validData(tempObj.text, btnAttrs.text, btnDefaultOptions.text, this.dialogOptions.title),
        plain: btnPlain
      }
    },
    bodyOptions({ bodyAttrs }) {
      return {
        ...bodyAttrs,
        ...this.$attrs,
        value: this.curValue,
        type: this.curType
      }
    },

    new$listeners() {
      return {
        ...this.$listeners,
        input: this.oninput,
        success: this.onsuccess,
        cancel: this.oncancel,
        ...this.bodyListeners
      }
    }
  },
  watch: {
    visible: {
      async handler(n) {
        if (n) {
          // this.dialogVisible为true，表示不是由visible打开弹窗，不执行onclick
          if (this.dialogVisible) return

          if (!await this.onclick()) this.$emit('update:visible', false)
        } else {
          this.dialogVisible = n
        }
      },
      immediate: true
    },
    dialogVisible(n) {
      this.$emit('update:visible', n)
    },

    loading: {
      handler(loading) {
        this.btnLoading = loading
      },
      immediate: true
    }
  },
  methods: {
    async doSubmit() {
      let res = await this.onsubmit()
      if (!res && res !== undefined) return
      this.dialogClose()
      this.runFn(this.valueResolve, res)
    },
    onsubmit() {
      return this.onsubmitFn()
    },
    async onsubmitFn() {
      if (!(await this.validate())) return false

      let valid = await this.beforeSubmit(this.curValue)
      if (!valid) return false

      let res = await this.doFn()
      res && this.success()
      return res
    },
    validate() {
      let { validate } = this.$refs.body || {}
      return typeof validate === 'function' ? awaitFormResolve(validate()) : true
    },
    async doFn() {
      let promise = this.createPromise()
      if (this.isLoadingOnSubmit) {
        awaitLoading(promise)
        // 等待loading效果生效
        await new Promise(resolve => setTimeout(resolve))
        await this.$nextTick()
      }

      if (this.$listeners.submit || this.$refs.body?.onsubmit) {
        this.$emit('submit', this.curValue, this.submitDone, this)
        this.runFn(this.$refs.body?.onsubmit, this.curValue, this.submitDone, this)
      } else {
        this.submitDone()
      }

      return promise
    },
    // valid：undefined（不执行success关闭弹窗），验证为true（执行success关闭弹窗），验证为false（不执行success不关闭弹窗）
    async submitDone(valid) {
      if (!this.isOriginData && valid instanceof Promise) {
        valid = await awaitResolve(valid, { mustCheckCode: false })
      }
      this.valueResolve(valid)
      return valid
    },
    success() {
      this.$message({
        type: 'success',
        message: '操作成功',
        customClass: 'uiid-zd-success'
      })
      this.$emit('success')
    },

    async dialogOpen(value = this.value, type = this.type) {
      this.curType = type
      this.curValue = this.isDeepValue ? this.cloneDeep(value) : value

      this.dialogVisible = true

      return this.createPromise()
    },
    dialogClose() {
      this.$refs.dialog?.handleClose()
    },
    handleBodyInput(type) {
      this.curType = type
    },

    async onclick() {
      if (this.btnLoading || this.disabled) return

      this.$emit('before-open')
      await this.runFn(this.init) // 加await，延迟打开dialog，使得init在创建之前执行
      if (typeof this.beforeOpen === 'function') {
        this.btnLoading = true
        try {
          let valid = await this.beforeOpen()
          if (!valid) return
        } catch (e) {
          console.log(e)
          return
        } finally {
          this.btnLoading = false
        }
      }

      this.dialogOpen()
      return true
    },
    oninput(...args) {
      this.$emit('input', ...args)
    },
    onsuccess(...args) {
      this.dialogClose()
      this.$emit('success', ...args)
    },
    async oncancel() {
      const valid = await this.beforeCancel()
      if (!valid) return
      this.dialogClose()
      this.$emit('cancel')
    },

    doOpen() {
      // console.log('doOpen')
      this.closeDialogLock = true
      this.$emit('open')
      return this.runFn(this.onopen)
    },
    doOpened() {
      // console.log('doOpened')
      this.$emit('opened')
      return this.runFn(this.onopened)
    },
    doClose() {
      if (!this.isDestroyOnClose) this.showDialogForce = true

      // console.log('doClose')
      this.$emit('close')
      this.runFn(this.$refs.body?.onclose)
      return this.runFn(this.onclose)
    },
    doClosed() {
      // console.log('doClosed')
      this.closeDialogLock = false
      this.$emit('closed')
      this.runFn(this.$refs.body?.onclosed)
      return this.runFn(this.onclosed)
    },

    onresize() {
      if (this.verticalCenter) {
        this.isResize = true
        clearTimeout(this.isResizeTimer)
        this.isResizeTimer = setTimeout(() => this.isResize = false, 12)
      }
    },
    getClientHeight() {
      var clientHeight = 0
      if (document.body.clientHeight && document.documentElement.clientHeight) {
        var clientHeight = (document.body.clientHeight < document.documentElement.clientHeight) ? document.body.clientHeight : document.documentElement.clientHeight
      } else {
        var clientHeight = (document.body.clientHeight > document.documentElement.clientHeight) ? document.body.clientHeight : document.documentElement.clientHeight
      }
      return clientHeight
    },

    getDialogProp(prop) {
      return validData(this.$attrs[prop], this[prop])
    },
    getComponentName() {
      return validData(this.componentName, this.componentNames?.[this.curType], 'edit')
    },
    getBtnName() {
      return this.btnName
    },

    runFn(fn, ...args) {
      return typeof fn === 'function' && fn(...args)
    },
    cloneDeep
  },
  directives: {
    style(el, binding) {
      const style = binding.value
      const dialogEle = el.getElementsByClassName('app-dialog')[0]
      if (!dialogEle) return
      const props = ['minWidth', 'maxWidth', 'height', 'maxHeight', 'minHeight']
      for (const prop of props) {
        dialogEle.style[prop] = style[prop]
      }
    }
  }
}
</script>

<style lang="scss">
.extend-dialog-wrapper {
  display: inline-block;
}

.extend-dialog-btn {
  cursor: pointer;
  &.is-disabled {
    cursor: not-allowed;
  }
  .el-button {
    &:not(.el-button--mini) {
      font-size: 14px;
    }

    &.el-button--small:not(.el-button--text) {
      height: 32px;
      padding: 0 12px;
    }
  }
}

.el-dialog__wrapper {
  .fixed-height {
    display: flex;
    flex-direction: column;
    // TODO：设置100vh，好像会有问题？
    max-height: 100vh;
    .el-dialog__body {
      flex: 1;
      //padding-top: 0;
      overflow: auto;
    }
  }
  .body-flex-one {
    .el-dialog__body {
      display: flex;
      flex-direction: column;
      overflow: hidden !important;
      > .flex-one-page {
        flex: 1;
        width: 100%;
      }
      > .flex-one-item {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        overflow: hidden;
        .el-table {
          overflow: hidden;
        }
      }
    }
  }


  &.vertical-center {
    display: flex;
    align-items: center;

    .el-dialog {
      display: flex;
      flex-direction: column;
      // TODO：设置100vh，好像会有问题？
      max-height: 100vh;
      .el-dialog__body {
        flex: 1;
        padding-top: 20px;
        overflow: auto;
      }
    }

    &.is-resize {
      flex-direction: column;
      .el-dialog {
        flex: 1;
      }
    }
  }
}
.extend-dialog {
  max-width: 100vw;
  //.svg-icon {
  //  position: relative;
  //  font-size: 18px;
  //}

  .el-table,
  &.el-table {
    //border-top: 1px solid $border-color;
    //border-left: 1px solid $border-color;

    th {
      //border-right: 1px solid $border-color;
    }
  }

  &.dialog-body-center {
    .el-dialog__body {
      text-align: center;
    }
  }

  .el-dialog__footer {
    //padding-bottom: 28px;
    .el-button {
      //min-width: 100px;
      margin: 0 0 0 10px;

      &.el-button--default {
        //color: #1a1a1a;
      }
    }
  }
}
</style>
