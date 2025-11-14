/* eslint-disable */
import { createDic } from '@/components/base/baseTable/store/dic'

const files = require.context('../states/dic', true, /\.js$/)
const result = files.keys().reduce((result, path) => {
  const value = files(path)
  result.push(value.default)
  return result
}, [])

export default createDic(result)
