import { debounce } from 'lodash'

export default function (eventName, wait = 500) {
  let onEvent = `on${eventName}`
  let handleEvent = `handle${eventName[0].toUpperCase() + eventName.slice(1)}`
  let eventCallback = `${eventName}Callback`
  return {
    mounted() {
      this[handleEvent]()
    },
    activated() {
      this[handleEvent]()
    },
    deactivated() {
      window.removeEventListener(eventName, this[eventCallback])
    },
    methods: {
      [handleEvent]() {
        if (this[onEvent]) {
          window.removeEventListener(eventName, this[eventCallback])
          if (!this[eventCallback]) {
            this[eventCallback] = debounce(
              this[onEvent],
              wait
            )
          }
          this.$nextTick(function () {
            this[eventCallback]()
            window.addEventListener(eventName, this[eventCallback])
            this.$once('hook:destroyed', () => {
              window.removeEventListener(eventName, this[eventCallback])
            })
          })
        }
      }
    }
  }
}
