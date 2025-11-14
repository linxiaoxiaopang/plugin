export function setLoading(fnName, loadingName = `${fnName}Loading`) {
  return async function (...args) {
    let loading = this[loadingName] = this[`${fnName}Fn`](...args)
    loading.finally(() => this[loadingName] = false)
    return await loading
  }
}