import {
  findByvalue,
  getComponent,
  getSearchType,
  setDic,
  setPx,
  deepClone
} from '../utils/util.js'
import { validatenull } from '../utils/validate.js'
import crudInput from '../crud/src/crud-input'
import crudSelect from '../crud/src/crud-select'
import crudRadio from '../crud/src/crud-radio'
import crudCheckbox from '../crud/src/crud-checkbox'
import crudCascader from '../crud/src/crud-cascader'
import crudDate from '../crud/src/crud-date'
import crudTime from '../crud/src/crud-time'
import crudInputNumber from '../crud/src/crud-input-number'
import crudUeditor from '../crud/src/crud-ueditor'
import crudUpload from '../crud/src/crud-upload'
import crudTooltip from '../crud/src/crud-tooltip'
import { vaildData, validData } from '@/components/avue/utils/util'
import { getDicName } from '@/components/avue/core/dic'

export default function () {
  return {
    data() {
      return {
        column: {},
        unwatch: {}
      }
    },
    components: {
      crudInput,
      crudSelect,
      crudRadio,
      crudCheckbox,
      crudDate,
      crudTime,
      crudCascader,
      crudInputNumber,
      crudUeditor,
      crudUpload,
      crudTooltip
    },
    methods: {
      GetDic: function (list) {
        return new Promise((resolve, reject) => {
          return resolve(list || {})
        })
      },
      getDicData(ele) {
        // 处理字典
        if (validatenull(ele.dicData)) {
          // ele.dicData为空，或者ele.dicData等于ele.prop（为了重新请求字典）
          if (!validatenull(ele.dicApi)) {
            ele.dicApi(this).then((res) => {
              this.$set(this.DIC, getDicName(ele), res)
              // console.log(ele.dicUrl, res.data);
            })
          }
        }
        return ele
      },
      setCascaderItem(formName, ele) {
        // 设置响应式后，二次调用时，watch里取到的this.column[nextProp]才是最新的。
        this.$set(this.column, ele.prop, ele)
        // this.column[ele.prop] = ele;
        if (!validatenull(ele.cascaderItem)) {
          let cascaderItem = [ele.prop, ...ele.cascaderItem]
          cascaderItem.forEach((prop, index) => {
            let nextProp = cascaderItem[index + 1]
            if (validatenull(nextProp)) return
            
            let watchName = `${formName}.${prop}`
            if (this.unwatch[watchName]) {
              this.unwatch[watchName]()
              this.unwatch[watchName] = undefined
            }
            this.unwatch[watchName] = this.$watch(
              watchName,
              (val) => {
                // console.log(watchName, val);
                if (!validatenull(val)) {
                  // nextColumn在$watch创建的时候并不存在，所以放到这里获取
                  let nextColumn = this.column[nextProp]
                  this.$set(nextColumn, 'dicData', '')
                  this.$httpGet(nextColumn.dicUrl.replace('{{key}}', val)).then((dict) => {
                    nextColumn.dicData = nextProp
                    this.$set(this.DIC, nextProp, dict)
                    // console.log(JSON.parse(JSON.stringify(this.unwatch)));
                    // 选择上级后，下级值清空
                    // cascaderItem.slice(index + 1).forEach(innerProp => {
                    //   // console.log(prop, innerProp);
                    //   this.$set(this[formName], innerProp, this[formName][innerProp] || '');
                    // })
                  })
                }
              },
              {
                immediate: true
              }
            )
          })
        }
        return ele
      },
      vaildData,
      validData,
      getComponent,
      getSearchType,
      findByvalue,
      setDic,
      setPx,
      deepClone
    }
  }
}
