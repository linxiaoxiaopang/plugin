/* eslint-disable */

export function setRequest(target, requestOption = target.requestOption) {
  for (const name in requestOption) {
    target[name] = request.bind(this, name)
  }
  
  async function request(name, ...args) {
    const { api, getParams } = requestOption[name]
    const params = await getParams(...args)
    return awaitResolveDetail(
      api(params)
    )
  }
}