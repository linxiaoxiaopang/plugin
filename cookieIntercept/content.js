// 当页面可见性变化时触发
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('当前 Tab 被激活了')

    // 这里可以执行需要的操作
    // 比如刷新 Cookie、请求最新数据等
  } else {
    console.log('当前 Tab 被隐藏了')
  }
})

