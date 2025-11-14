
export default {
  props: {
    sup_this: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false
    }
  },
  methods: {
    async love() {
    },

    success() {
      this.$emit('successInfo')
      // console.log(' this.sup_this',  this.sup_this)
      // this.sup_this && this.sup_this.init()
    }
  }
}
