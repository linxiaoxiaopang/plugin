/* eslint-disable */
import { now } from 'lodash'

//设置setTimeout延迟
export async function waitTimeByNum(num) {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, num)
  })
}

// 时间间隔之后再次执行，才会执行目标函数
export function debounceTime(func, wait) {
  let lastCallTime
  return function () {
    const time = now()
    if (!lastCallTime) {
      lastCallTime = time
      return
    }
    if (time - lastCallTime >= wait) {
      lastCallTime = undefined
      return func()
    }
  }
}
/*
 * 在超量循环中，暂停执行，避免阻塞
 * 适用范围：可以被暂停的循环
 * */
export function waitTimeThrottle(wait = 1000 / 12) {
  let timer
  let waitTimeDebounced = debounceTime(
    () => timer = null,
    wait
  )
  /*
  * 在超量循环中，暂停执行，避免阻塞
  * 适用范围：可以被暂停的循环
  * */
  return function waitTime(num) {
    // 当次执行时间在上次执行时间后一定时间，将timer设为null，暂停执行
    waitTimeDebounced()
    // console.log(timer)
    
    // timer为null时，暂停执行
    if (timer === null) {
      timer = undefined
      // 返回Promise，暂停执行
      return waitTimeByNum(num)
    }
  }
}
export const waitTime = waitTimeThrottle()

/*
* 为不同作用域的行为，提供缓冲
* 形成一条完整的微任务链
* */
export function createGlobalWait(defaultWait) {
  let promise
  return function globalWait(wait = defaultWait) {
    return promise = new Promise(async resolve => {
      await promise
      // 每经过一定时间，暂停执行一段时间
      await waitTime(wait)
      resolve()
    })
  }
}
export const globalWait = createGlobalWait()