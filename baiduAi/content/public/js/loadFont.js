const font1 = new FontFace('iconfont', `url(${getUrl("/iconfont/iconfont.woff2?t=1688345853791")}), url(${getUrl("/iconfont/iconfont.woff?t=1688345853791")}), url(/iconfont/iconfont.ttf?t=1688345853791)`)
const font2 = new FontFace('element-icons', `url(${getUrl("/theme/fonts/element-icons.woff")}), url(${getUrl("/theme/fonts/element-icons.ttf")})`)
font1.load().then(function() {
  document.fonts.add(font1)
})
font2.load().then(function() {
  document.fonts.add(font2)
})

function getUrl(url) {
  if(chrome?.runtime) return chrome.runtime.getURL(`/content/dist/${url}`)
  return url
}
