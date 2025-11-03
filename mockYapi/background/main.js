import { MockClass } from './mockClass'
const instance = new MockClass()
instance.getYApiData().then(() => {
  instance.init()
  instance.createMockData()
})
