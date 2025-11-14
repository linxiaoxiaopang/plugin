export default {
  inserted(el) {
    document.body.appendChild(el)
  },

  unbind(el) {
    el.parentNode.removeChild(el)
  }
}
