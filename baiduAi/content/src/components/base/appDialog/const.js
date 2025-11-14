/* eslint-disable no-undef */
export const defaultOptions = {
  dialogType: 'elDialog',
  title: '编辑',
  width: 800,
  appendToBody: true,
  hasFooter: true,
  cancelBtn: true,
  cancelText: '取消',
  cancelSize: 'small',
  confirmBtn: true,
  confirmText: '确定',
  confirmSize: 'small',
  customClass: 'app-dialog',
  closeOnClickModal: false,
  drag: false
}

export const btnDefaultOptions = {
  hasBtn: true,
  size: 'small',
  type: 'normal'
}

export const dialogProps = [
  'is',
  'title',
  'width',
  'fullscreen',
  'top',
  'modal',
  'modalAppendToBody',
  'appendToBody',
  'lockScroll',
  'closeOnClickModal',
  'closeOnPressEscape',
  'showClose',
  'beforeClose',
  'center',
  'destroyOnClose',
  
  // elDrawer
  'size',
  'withHeader',
  'direction',
  'wrapperClosable',
  'withHeader'
]

export const btnProps = [
  'type',
  'size',
  'icon',
  'text',
  'class'
]