<!--<template>
  <div v-if="show || isKeepExist" v-show="show" class="keep-exist">
    <slot></slot>
  </div>
</template>-->

<script>
export default {
  name: 'KeepExist',
  props: {
    show: {},
    active: {},
    lazy: Boolean,
    prop: {},
    include: Array,
    exclude: Array,
    isWrapper: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isShow: false
    }
  },
  computed: {
    isKeepExist() {
      return this.isShow && this.isInclude
    },
    isInclude({ include, exclude, prop }) {
      if (!prop) return true
      const isInclude = include ? include.includes(prop) : true
      const isExclude = exclude ? exclude.includes(prop) : false
      return isInclude && !isExclude
    },

    isActive({ show }) {
      if (this.lazy) {
        return this.active === this.prop
      } else {
        return show
      }
    }
  },
  watch: {
    isActive: {
      handler(n) {
        if (n) this.isShow = n
      },
      immediate: true
    }
  },
  render(h) {
    const { isActive: show } = this
    if (!(show || this.isKeepExist)) return

    const children = this.$slots.default
    if (children.length <= 1 && !this.isWrapper) {
      return children.map(vnode => {
        // 设置 v-show 属性
        vnode.data = vnode.data || {}
        vnode.data.directives = vnode.data.directives || []
        vnode.data.directives.push({
          name: 'show',
          value: show // 根据条件设置为 true 或 false
        })

        return vnode
      })
    }
    return h(
      'div',
      {
        directives: [
          {
            name: 'show',
            value: show
          }
        ]
      },
      children
    )
  }
}
</script>

<style lang="scss" scoped>

</style>