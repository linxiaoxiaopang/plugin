class DealWithShopData {
  constructor() {
    this.pageNumber = 1
    this.allData = []
    this.cacheData = {}
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
    this.cacheData = await this.getNewGoodsList()
    // if(this.cacheData?.finish) throw '该页面已经爬取完成。'
    this.pageNumber = this.cacheData.nextPageNumber || 1
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
    const result = this.formatResult(res)
    await this.syncData(result)
    this.allData.push(result)
    const hasMore = res?.result?.has_more
    if (!hasMore) return
    this.pageNumber++
    await this.wait(3000)
    // await this.getData()
  }

  formatResult(res) {
    const result = {
      pageSize: this.request?.body?.page_size,
      pageNumber: this.pageNumber
    }
    const goodsList = res?.result?.data?.goods_list || []
    result.data = goodsList.map(item => {
      const {
        title,
        image: {
          url
        },
        sales_num: salesNum,
        link_url: linkUrl,
        seo_link_url: seoLinkUrl,
        price_info: { price_str: price, market_price_str: marketPrice }
      } = item
      return {
        salesNum,
        price,
        marketPrice,
        title,
        url,
        linkUrl,
        seoLinkUrl
      }
    })
    const salesNum = result.data.slice(-1)?.[0]?.salesNum || 0
    result.finish = !salesNum
    return result
  }

  async getNewGoodsList() {
    let resolveHandler = null
    const p = new Promise(resolve => resolveHandler = resolve)
    chrome.runtime.sendMessage(
      {
        action: 'getNewGoodsList'
      },
      (response) => {  // 接收background的响应
        resolveHandler(response?.data)
      }
    )
    return await p
  }

  async clearNewGoodsList() {
    let resolveHandler = null
    const p = new Promise(resolve => resolveHandler = resolve)
    chrome.runtime.sendMessage(
      {
        action: 'clearNewGoodsList'
      },
      () => {  // 接收background的响应
        resolveHandler(true)
      }
    )
    return await p
  }

  async syncData(result) {
    let resolveHandler = null
    const p = new Promise(resolve => resolveHandler = resolve)
    chrome.runtime.sendMessage(
      {
        action: 'setNewGoodsList',  // 自定义动作类型，用于区分不同消息
        data: {
          data: result
        }  // 要发送的数据
      },
      () => {  // 接收background的响应
        if (chrome.runtime.lastError) throw chrome.runtime.lastError
        resolveHandler(true)
      }
    )
    return await p
  }

  async getAllData() {
    try {
      this.request = await this.getCacheRequest()
      await this.getData()
    } catch (err) {
      alert(err?.message || err)
    }
  }
}


let loading = false

loadBtn()

function loadBtn() {
  createBtn('抓取数据', {
    top: '30%'
  }, async () => {
    const instance = new DealWithShopData()
    await instance.getAllData()
  })

  createBtn('下载数据', {
    top: '50%'
  }, async () => {
    const url = chrome.runtime.getURL('./content/exportExcel.js')
    const { default: exportExcel } = await import(url)
    const instance = new DealWithShopData()
    const data = await instance.getNewGoodsList()
    await exportExcel(data?.list || [], 'temu-shop-goods.xlsx')
  })

  createBtn('清除缓存', {
    top: '70%'
  }, async () => {
    const instance = new DealWithShopData()
    await instance.clearNewGoodsList()
  })
}

function createBtn(txt, style = {}, callback) {
  const button = document.createElement('button')
  button.innerText = txt
  Object.assign(button.style, {
    background: '#fb7701',
    color: '#fff',
    padding: '20px',
    borderRadius: '5px',
    position: 'fixed',
    fontSize: '30px',
    right: '10px'
  }, style)

  button.addEventListener('click', async () => {
    loading = true
    button.innerText = `正在${txt}...`
    await callback(button)
    button.innerText = txt
    loading = false
  })
  document.body.appendChild(button)
}
