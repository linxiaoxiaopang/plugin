import { hasOwnProperties } from '@/components/avue/utils/util'

export default function({ name, mercenary, receiver, attrs, dataAttrs, list }) {
  if (!list) {
    list = [
      {
        receiver,
        attrs,
        dataAttrs
      }
    ]
  }
  const data = {}
  list.forEach((reward) => {
    Object.assign(data, reward.dataAttrs)
  })
  return {
    data() {
      return {
        ...data,
        attrs: {}
      }
    },
    computed: {
      parentThis() {
        return this.$attrs.sup_this || this.$parent
      },
      parentRewardList({ parentThis: { rewardList } }) {
        if (!rewardList) return { canReceive: [], notReceive: [] }
        const canReceive = []
        const notReceive = []
        rewardList.forEach((item) => {
          const { receiver, keys } = item
          if (receiver && !receiver.includes(name)) {
            notReceive.push(item)
            return
          }

          const notItem = { ...item, keys: [] }
          keys.forEach(key => {
            if (this[key] !== undefined) {
              canReceive.push(key)
            } else {
              notItem.keys.push(key)
            }
          })
          if (notItem.keys.length) {
            notReceive.push(notItem)
          }
        })
        return {
          canReceive,
          notReceive: notReceive.map(item => {
            if (!item.receiver) return item
            return {
              ...item,
              receiver: item.receiver.includes(name) ? item.receiver.concat(mercenary) : item.receiver
            }
          })
        }
      },
      currentRewardList() {
        return list.reduce((prev, next) => prev.concat(this.normalizeReward(next)), [])
      },
      rewardList() {
        return [
          ...this.currentRewardList,
          ...this.parentRewardList.notReceive
        ]
      }
    },
    watch: {
      parentThis: {
        handler(parentThis) {
          if (!parentThis) return
          this.parentRewardList.canReceive.forEach(key => this.setWatch(parentThis, key))
        },
        immediate: true
      }
    },
    created() {
      console.log('created', this.$options.name, this)
    },
    // mounted() {
    //   console.log('mounted', this.$options.name, this);
    // },
    methods: {
      setWatch(target, key) {
        if (!target.rewardListUnwatchs) target.rewardListUnwatchs = {}
        target.rewardListUnwatchs[key]?.()

        target.rewardListUnwatchs[key] = this.$watch(
          key,
          function name(value) {
            target[key] = value
          },
          { 
            immediate: true,
            deep: true
          }
        )
      },
      normalizeReward(reward) {
        const { attrs, dataAttrs } = reward
        const result = []
        if (attrs) {
          for (const key in attrs) {
            let option = attrs[key]
            if (!hasOwnProperties(option, ['alias', 'receiver', 'doner', 'consignor'])) {
              option = {
                default: option
              }
            }
            result.push({
              key,
              alias: key,
              ...reward,
              ...option,
              set: (key, value) => {
                this.$set(this.attrs, key, value)
              }
            })
          }
        }
        if (dataAttrs) {
          for (const key in dataAttrs) {
            let option = dataAttrs[key]
            if (!hasOwnProperties(option, ['alias', 'receiver', 'doner', 'consignor'])) {
              option = {
                default: option
              }
            }
            result.push({
              key,
              alias: key,
              ...reward,
              ...option,
              target: this
            })
          }
        }
        return result
      },
      getChild(name) {
        return this.$refs[name]
      }
    }
  }
}