/**
 * File 对象转 Base64 核心函数
 * @param {File} file - 图像 File 对象
 * @returns {Promise<string>} Base64 编码字符串
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    // 读取文件为 DataURL（Base64 格式）
    reader.readAsDataURL(file)
    // 读取成功
    reader.onload = (e) => resolve(e.target.result)
    // 读取失败
    reader.onerror = (error) => reject(error)
  })
}
