/* eslint-disable */

export function requestMockWrap(data) {
  return async (params) => {
    const { pageIndex = 1, pageSize = 10 } = params.page || {}
    const result = {
      "code": 0,
      "message": "",
      "detailMessage": null,
      "page": {
        "total": data.length,
        pageIndex,
        pageSize,
        "offset": 0
      },
      detail: pageSize === 0 ? data : data.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
    }
    console.log({ params, result })
    await new Promise(resolve => setTimeout(resolve, 100))
    return result
  }
}

export function requestDataMockWrap(data) {
  return async (params) => {
    const { pageIndex = 1, pageSize = 10 } = params.page || {}
    const result = {
      "code": 0,
      "message": "",
      "detailMessage": null,
      "page": {
        "total": data.length,
        pageIndex,
        pageSize,
        "offset": 0
      },
      detail: data
    }
    console.log({ params, result })
    await new Promise(resolve => setTimeout(resolve, 100))
    return result
  }
}