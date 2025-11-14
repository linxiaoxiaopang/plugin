importDom()

async function importDom() {
  const url = chrome.runtime.getURL('./content/module/dom.js')
  await import(url)
}
