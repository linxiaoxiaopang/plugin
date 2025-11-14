/* eslint-disable */
export function combinedAsyncFunc(firstAsyncFunc, ...asyncFuncs) {
  let lastPromise
  
  async function runAsyncFunc() {
    let currentPromise = lastPromise = firstAsyncFunc()
    await lastPromise
    for (let func of asyncFuncs) {
      if (currentPromise === lastPromise) {
        try {
          await func();
        } catch (error) {
          console.error(`Async function ${func.name} failed: ${error}`);
          break; // 如果某个异步函数执行失败，停止执行后续的异步函数
        }
      } else {
        break; // 如果已经中断，停止执行后续的异步函数
      }
    }
  }
  runAsyncFunc.__proto__.abort = () => {
    lastPromise = null
  }
  return runAsyncFunc
}