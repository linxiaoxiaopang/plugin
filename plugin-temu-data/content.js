class GetAllShopData {
  constructor() {
    this.pageNumber = 1
    this.allData = []
  }

  wait(time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  }

  async getCacheRequest() {
    const p = new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          action: "getCacheRequest"
        },
        async (response) => {
          resolve(response)
        }
      )
    })
    const response = await p
    if (!response.data || !response.data.headers || !response.data.body) throw '请先点击加载更多按钮，获取请求头和请求体。'
    return response.data
  }

  async getData() {
    const url = chrome.runtime.getURL('./content/anti.js')
    const { default: anti } = await import(url)
    const antiContent = await anti.cN()
    this.request.body.anti_content = antiContent
    this.request.body.page_number = this.pageNumber
    const res = await fetch('https://www.temu.com/api/bg/circle/c/mall/newGoodsList?is_back=1', {
      method: 'post',
      headers: this.request.headers,
      body: JSON.stringify(this.request.body)
    }).then(async res => {
      return await res.json()
    })
    if (!res.success) throw `请求${this.pageNumber}页失败`
    const data = res?.result?.data?.goods_list || []
    this.allData.push(...data)
    const hasMore = res?.result?.has_more
    if (!hasMore) return
    this.pageNumber++
    await this.wait(3000)
    await this.getData()
  }

  async action() {
    try {
      this.request = await this.getCacheRequest()
      await this.getData()
    } catch (err) {
      alert(err?.message || err)
    }
  }
}


let loading = false
let button = null

loadBtn()

function loadBtn() {
  button = document.createElement('button')
  button.innerText = '抓取数据'
  Object.assign(button.style, {
    background: '#fb7701',
    color: '#fff',
    padding: '20px',
    borderRadius: '5px',
    position: 'fixed',
    top: '50%',
    fontSize: '30px',
    transform: 'translateY(-50%)',
    right: '10px'
  })

  button.addEventListener('click', async () => {
    if (loading) return
    loading = true
    button.innerText = '正在抓取数据...'
    const instance = new GetAllShopData()
    await instance.action()
    button.innerText = '抓取数据'
    loading = false
  })
  document.body.appendChild(button)
}


