let xIntranetIp = null
let xInternetIp = null

/**
 * 获取内网和外网ip
 * @returns {{xInternetIp: null, xIntranetIp: null}}
 */
export async function getIP() {
  if (!xIntranetIp) {
    xIntranetIp = await getIntranetIp()
  }
  if (!xInternetIp) {
    xInternetIp =  getInternetIp()
  }
  return {
    xIntranetIp,
    xInternetIp
  }
}

/**
 * 获取内网Ip
 * @returns {Promise<内网ip>}
 */
export async function getIntranetIp() {
  let MyPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
  let pc = new MyPeerConnection({
    iceServers: []
  })
  let noop = () => {
  }

  pc.createDataChannel('')
  try {
    const sdp = await pc.createOffer()
    pc.setLocalDescription(sdp, noop, noop)
  } catch (err){
    console.log('err', err)
    return 'abnormal'
  }
  //创建promise,并保留resolve的引用
  let resolveHandler = null
  const promise = new Promise((resolve) => {
    resolveHandler = resolve
  })
  pc.onicecandidate = (ice) => {
    if (!ice || !ice.candidate || !ice.candidate.candidate) return
    xIntranetIp = ice.candidate.address //内网地址赋值
    resolveHandler(ice.candidate.address)
  }
  //超过200毫秒提示超时
  setTimeout(() => {
    resolveHandler('overtime')
  }, 200)
  return await promise
}


/**
 * 获取外网ip
 */
function getInternetIp() {
  try {
    return '127.0.0.1'
    // return returnCitySN?.cip || ''
  } catch {
    return 'abnormal'
  }
}
