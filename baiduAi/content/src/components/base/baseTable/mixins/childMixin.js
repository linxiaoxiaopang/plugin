/* eslint-disable */
import { isEqual } from 'lodash'

export default function ({ dataAttrs = {} } = {}) {
  return {
    data() {
      return {
        parentData: dataAttrs,
        parentEvents: {}
      }
    },
    computed: {
      sup_this() {
        return this.$attrs.parent || this.$attrs.sup_this || this.$parent
      }
    },
    methods: {
      on(instance, name, event) {
        if (!instance) return
  
        if (!this.parentEvents[name]) this.parentEvents[name] = []
        const events = this.parentEvents[name]
        const parentEvent = [instance, event]
        const oEvent = events.find(event => isEqual(event, parentEvent))
        if (!oEvent) {
          parentEvent[2] = () => instance.$off(name, event)
          events.push(parentEvent)
          this.$once('hook:destroyed', parentEvent[2])
        }
        
        instance.$on(name, event)
      },
      off(instance, name, event) {
        if (!instance) return
  
        if (!this.parentEvents[name]) this.parentEvents[name] = []
        const events = this.parentEvents[name]
        const parentEvent = [instance, event]
        const oEvent = events.find(event => isEqual(event.slice(0, 2), parentEvent))
        if (oEvent) {
          this.$off('hook:destroyed', oEvent[2])
          this.parentEvents[name] = events.filter(item => item !== oEvent)
        }
        
        instance.$off(name, event)
      }
    }
  }
}