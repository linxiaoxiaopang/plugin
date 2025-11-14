<template>
  <component :is="component" v-model="text" v-bind="$attrs" @change="onchange"></component>
</template>

<script>
export default {
  props: {
    componentType: {
      type: String,
      default: 'input'
    },
    value: {}
  },
  data() {
    return {
      text: ''
    }
  },
  computed: {
    component() {
      return {
        input: 'avueCrudInput',
        radio: 'avueCrudRadio',
        checkbox: 'avueCrudCheckbox',
        select: 'avueCrudSelect',
        date: 'avueCrudDate',
        time: 'avueCrudTime',
        rate: 'avueCrudRate',
        slider: 'avueCrudSlider',
        switch: 'avueCrudSwitch',
        upload: 'avueCrudUpload',
        cascader: 'avueCrudCascader',
      }[this.componentType]
    }
  },
  watch: {
    value: {
      handler(val) {
        this.text = val
      },
      immediate: true
    }
  },
  methods: {
    onchange() {
      this.$emit('change', this.text)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>