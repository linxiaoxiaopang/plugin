// src/directives/moveTo.js

export default {
  /**
   * 当绑定元素插入到 DOM 中时调用
   * @param {HTMLElement} el - 指令所绑定的元素（即组件的根元素）
   * @param {Object} binding - 指令的绑定信息
   * @param {Object} vnode - Vue 编译生成的虚拟节点
   */
  inserted(el, binding) {
    // 1. 获取目标容器的选择器
    const targetSelector = binding.value
    setTimeout(() => {
      const target = document.querySelector(targetSelector)
      target.insertAdjacentElement('afterend', el)
    }, 20)
  },

  /**
   * 当指令与元素解绑时调用
   * @param {HTMLElement} el - 指令所绑定的元素
   */
  unbind(el) {
  }
}
