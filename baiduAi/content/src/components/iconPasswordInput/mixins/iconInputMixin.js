export default function () {
  return {
    props: {
      clearable: {
        type: Boolean,
        default: true
      }
    },

    data() {
      return {
        showPassword: true,
        showClear: false
      }
    },

    mounted() {
      //监听input组件中的showClear计算属性的变化
      this.appendAndWatchPassowrdIcon()
    },

    methods: {
      changeIcon() {
        this.showPassword = !this.showPassword
      },
      //监听input组件中的showClear计算属性的变化
      appendAndWatchPassowrdIcon() {
        const { passwordIcon } = this.$refs
        //将passwordIcon添加到passwordInput容器中，修复鼠标移入父容器的时候，passwordIcon不会晃动
        this.$refs.passwordInput.$el.append(passwordIcon)
        this.$watch('$refs.passwordInput.showClear', (newVal) => {
          this.showClear = newVal
        })
      }
    }
  }
}
