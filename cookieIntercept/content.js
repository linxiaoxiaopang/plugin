document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState != 'visible') return
  //阻塞50ms 给后台更新 cookie流出时间
  sleepSync(50)
})


function sleepSync(ms) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    // 空循环阻塞
  }
}
