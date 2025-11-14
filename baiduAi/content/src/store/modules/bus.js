/* eslint-disable */

const bus = {
  state: {
    BUS: {},

    websocketEvent: {}
  },
  mutations: {
    SET_BUS(state, data) {
      Object.assign(state.BUS, data)
    },

    EMIT_WEBSOCKET_EVENT(state, { type, message }) {
      state.websocketEvent[type] && state.websocketEvent[type](message)
    }
  },
  actions: {
    GetWebsocketMessage({ state }, type) {
      return new Promise((resolve) => {
        state.websocketEvent[type] = resolve
      })
    }
  }
}

export default bus
