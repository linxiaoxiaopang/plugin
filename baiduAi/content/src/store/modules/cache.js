export default {
  namespaced: true,

  state: {
    cacheData: {}
  },

  mutations: {
    UPDATE_CACHE_DATA(state, { key, path, value }) {
      state.cacheData[key] || (state.cacheData[key] = {})
      if (!path) {
        state.cacheData[key] = value
        return
      }
      state.cacheData[key][path] = value
    },

    DELETE_CACHE_DATA(state, { key, path }) {
      if (!path) {
        delete state.cacheData[key]
        return
      }
      delete state.cacheData[key][path]
    }
  },

  actions: {}
}

