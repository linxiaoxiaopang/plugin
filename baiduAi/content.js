class AnalysisEntry {
  constructor() {
    this.prefix = 'content/dist'
  }

  async getContent() {
    const entryUrl = chrome.runtime.getURL('content/dist/index.html')
    const response = await fetch(entryUrl, {
      method: 'get'
    })
    return await response.text()
  }

  getRelativePath(url) {
    try {
      const urlParser = new URL(url)
      return `${this.prefix}/${urlParser.pathname}`
    } catch {
      return url
    }
  }

  getScriptUrls(doc) {
    const scriptList = [...doc.querySelectorAll('script')]
    return scriptList.map(item => this.getRelativePath(item.src))
  }

  getCssUrls(doc) {
    const links = [...doc.querySelectorAll('link[rel="stylesheet"]')]
    return links.map(item => this.getRelativePath(item.href))
  }

  async analysis() {
    try {
      const content = await this.getContent()
      if (!content) return false
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      const scriptUrls = this.getScriptUrls(doc)
      const cssUrls = this.getCssUrls(doc)
      return {
        scriptUrls,
        cssUrls
      }
    } catch (err) {
      return false
    }
  }
}

(async () => {
  const instance = new AnalysisEntry()
  const res = await instance.analysis()
  if (!res) return

  const { scriptUrls, cssUrls } = res
  for (let item of scriptUrls) {
    const url = chrome.runtime.getURL(item)
    await import(url)
  }

  for (let item of cssUrls) {
    const href = chrome.runtime.getURL(item)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = href
    document.head.appendChild(link)
  }
})()

