export default {
  methods: {
    createPromise(name = 'value') {
      return this[`${name}Promise`] = new Promise((resolve, reject) => {
        this[`${name}Resolve`] = resolve
        this[`${name}Reject`] = reject
      })
    }
  }
}
