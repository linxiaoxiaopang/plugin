<template>
  <div class="check-box-group-slot">
    <el-checkbox-group class="cate-list" v-model="currentValue" v-bind="$attrs" v-on="new$listeners">
      <CheckBoxSlot :label="item[dictValue]" v-bind="item.props" v-for="(item, index) in dic" :key="index"
                    @change="option.onchange(item[dictValue], $event)">
        <div :class="['cate-item', `cate-item--${size}`, isActive(item[dictValue]) && 'active']">
          <slot :row="item" :index="index">
            <template v-if="item[dictUrl]">
              <defaultImg v-if="preview" :fit="fit" :src="finalSrc(item[dictUrl])"content="" lWidth="300" lHeight="300" v-bind="imageStyle" />
              <el-image v-else :fit="fit" :src="finalSrc(item[dictUrl])"></el-image>
            </template>
            <p class="item-label" v-else>{{ item[dictLabel] }}</p>
          </slot>
        </div>
      </CheckBoxSlot>
    </el-checkbox-group>
  </div>
</template>

<script>
import CheckBoxSlot from '@/components/checkBoxSlot'
import defaultImg from '@/views/components/defaultImg'
import props from '@/mixins/dic/props'
import { isArray } from 'lodash'
import { validatenull } from '@/components/avue/utils/validate'
import { PICSIZE } from '@/utils/constant'

export default {
  components: {
    CheckBoxSlot,
    defaultImg
  },

  mixins: [props],

  props: {
    value: {},
    // medium | small | mini
    size: {
      type: String,
      default: 'small'
    },

    //radio | checkbox
    type: {
      type: String,
      default: 'radio'
    },

    isInitEmptyValue: Boolean,

    dic: {
      type: Array,
      default() {
        return []
      }
    },

    fit: {
      type: String,
      default: 'contain'
    },
    preview: Boolean
  },

  computed: {
    new$listeners({ $listeners }) {
      const { input, ...rest$listeners } = $listeners
      return rest$listeners
    },

    finalSrc() {
      return (src) => {
        return src + PICSIZE.min
      }
    },

    imageStyle() {
      return {
        medium: { width: 56, height: 56 },
        small: { width: 36, height: 36 }
      }[this.size]
    },

    option({ type }) {
      const list = {
        radio: {
          getCurrentValue: () => {
            if (!this.value) return []
            if (isArray(this.value)) return this.value
            return [this.value]
          },
          setCurrentValue: () => {
          },

          onchange: (value, checked) => {
            if (!checked) return
            this.$emit('input', value)

            // if (checked) {
            //   this.$emit('input', value)
            //   return
            // }

            // return this.$emit('input', '')
          }
        },

        checkbox: {
          getCurrentValue: () => {
            if (!this.value) return []
            if (isArray(this.value)) return this.value
            return [this.value]
          },

          setCurrentValue: (newVal) => {
            this.$emit('input', newVal)
          },

          onchange() {
          }
        }
      }
      return list[type]
    },

    currentValue: {
      get() {
        return this.option.getCurrentValue()
      },

      set(newVal) {
        this.option.setCurrentValue(newVal)
      }
    },

    isActive({ currentValue }) {
      return (value) => {
        return currentValue.includes(value)
      }
    },

    dictUrl() {
      return this.props.url || 'thumbnailPath'
    }
  },

  watch: {
    dic: {
      handler(newVal) {
        if (validatenull(newVal)) return []
        if (this.isInitEmptyValue && validatenull(this.currentValue)) {
          this.$emit('input', newVal[0][this.props.value])
        }
      },
      immediate: true
    }
  }
}

</script>

<style lang="scss" scoped>
.cate-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  ::v-deep {
    .check-box_slot {
      margin: 0;

      .el-checkbox__input {
        display: none;
      }
    }
  }
}

.cate-item {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid $border-color;
  cursor: pointer;

  &::v-deep .el-image {
    width: 100%;
    height: 100%;
  }

  .item-label {
    @include overflow-more(3);
    white-space: initial;
  }
}

.cate-item--medium {
  width: 60px;
  height: 60px;
}

.cate-item--small {
  width: 40px;
  height: 40px;
}

.active {
  border: 2px solid $color-primary;
}

.active::after {
  content: "\e6da";
  width: 18px;
  height: 18px;
  background: $color-primary;
  position: absolute;
  bottom: 0px;
  right: 0px;
  padding: 3px;
  font-family: element-icons !important;
  speak: none;
  font-style: normal;
  font-weight: 600;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  vertical-align: baseline;
  display: inline-block;
  -webkit-font-smoothing: antialiased;
  color: #fff;
}
</style>
