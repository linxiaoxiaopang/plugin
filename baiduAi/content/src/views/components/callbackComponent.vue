<template>
  <component
    ref="component"
    :is="component"
    :option="option"
    v-model="value"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template v-for="col in slotColumns" v-slot:[col.prop]="scope">
      <slot :name="col.prop" v-bind="scope" :$column="col">
        <callbackComponent
          v-if="col.slots"
          v-for="(childSlot, index) in col.slots"
          :key="index"
          v-model="value"
          v-bind="{
            ...scope,
            ...childSlot,
            ...childSlot.componentAttrs
          }"
        ></callbackComponent>
      </slot>
    </template>
  </component>
</template>

<script>
import defaultImg from '@/views/components/defaultImg'

export default {
  name: 'callbackComponent',
  components: {
    defaultImg
  },
  props: {
    component: String|Object,
    value: {},
    slots: {
      type: Array,
      default: () => []
    },
    option: {
      type: Object,
      default: () => {
        return {
          slots: [],
          column: []
        }
      }
    }
  },
  data() {
    return {
    
    }
  },
  computed: {
    slotColumns({ slots, option }) {
      let tempArr = (slots || []).concat(option.slots || [])
      option?.column?.forEach(col => {
        if (col.slot || col.formslot) {
          tempArr.push(col)
        }
      })
      return tempArr.map(slot => {
        let tempObj = slot?.slots ? slot : {
          prop: slot,
          slots: [
            {
              component: slot
            }
          ]
        }
        tempObj.slots = tempObj.slots.map(cSlot => {
          return cSlot?.component ? cSlot : {
            component: cSlot
          }
        })
        return tempObj
      })
    }
  },
  // created() {
  //   console.log(this.slots , this.option, this.slotColumns)
  // },
  methods: {
    validate() {
      let validate = this.$refs.component.validate
      return validate ? validate() : true
    },
    isNativeDom() {
      return !this.$refs.component.$el
    }
  }
}
</script>