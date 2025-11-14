import { isArray, isString } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'

export function getParentByComponentName(componentName, instance = this) {
  var parent = instance.$parent || instance.$root
  var name = parent.$options.componentName
  
  while (parent && (!name || name !== componentName)) {
    parent = parent.$parent
    
    if (parent) {
      name = parent.$options.componentName
    }
  }
  
  return parent
}

export function getParentByClassName(className, instance = this) {
  var parent = instance.$el.parentNode
  var classList = parent.classList
  
  while (parent && (!classList || ![...parent.classList].includes(className))) {
    parent = parent.parentNode
    
    if (parent) {
      classList = parent.classList
    }
  }
  
  return parent
}





// 模拟Vue中的事件修饰符实现
export function stopPropagation(e) {
  e.stopPropagation()
}
export function preventDefault(e) {
  e.preventDefault()
}
export function wrappedListener(listener, modifiers = []) {
  if (!listener) return () => {}
  if (isString(modifiers)) modifiers = [modifiers]
  return function (e, ...args) {
    if (modifiers.includes('prevent')) {
      preventDefault(e)
    }
    if (modifiers.includes('stop')) {
      stopPropagation(e)
    }
    return listener(e, ...args)
  }
}

export function invokeListener(listener, ...args) {
  if (validatenull(listener)) return
  
  listener = [].concat(listener)
  for (const fn of listener) {
    fn.apply(this, args)
  }
}

export function getRefNode(vnode) {
  return isArray(vnode) ? vnode[0] : vnode
}