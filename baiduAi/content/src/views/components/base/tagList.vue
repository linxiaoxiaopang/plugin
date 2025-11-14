<template>
  <el-row class="tag-list" :gutter="gutter" :class="outerClass">
    <el-col
      v-if="hasCheckAll"
      :span="1.5"
      :class="{ active: selectIndex == 0 }"
      class="checkbox-all"
      @click.native="oninput([])"
    >全部</el-col
    >
    <el-col v-for="(color, index) in colors" :key="index" class="tag-item">
      <el-popover v-if="showPopover" :open-delay="300" placement="top-start" trigger="hover">
        筛选"{{ curColor(color) }}"标记的数据
        <div
          slot="reference"
          class="tag-item-content"
          :class="{ 'is-active': isActive(color) }"
          :style="{
            backgroundColor: color[props.label]
          }"
          @click="onclick(color, index)"
        >
          <i v-if="['tick'].includes(activeType)" class="el-icon-check"></i>
          <template v-if="['customSign'].includes(type)">
            <el-input
              v-if="isEdit[index]"
              :ref="`editInput${index}`"
              v-model="color.description"
              class="tag-item-content__text"
              size="mini"
              placeholder="无描述"
              @blur="isEdit[index] = false"
              @click.stop.native=""
              @change="onchange(index)"
            ></el-input>
            <span v-else class="tag-item-content__text">{{ color.description || '无描述' }}</span>
          </template>
        </div>
        <svg-icon
          v-if="['customSign'].includes(type)"
          icon-class="cebianlan_bianji"
          class-name="svg-icon-edit"
          @click.native="edit(index)"
        ></svg-icon>
      </el-popover>
      <div
        v-else
        class="tag-item-content"
        :class="{ 'is-active': isActive(color) }"
        :style="{
          backgroundColor: color[props.label]
        }"
        @click="onclick(color, index)"
      >
        <i v-if="['tick'].includes(activeType)" class="el-icon-check"></i>
        <template v-if="['customSign'].includes(type)">
          <el-input
            v-if="isEdit[index]"
            :ref="`editInput${index}`"
            v-model="color.description"
            class="tag-item-content__text"
            size="mini"
            placeholder="无描述"
            @blur="isEdit[index] = false"
            @click.stop.native=""
            @change="onchange(index)"
          ></el-input>
          <span v-else class="tag-item-content__text">{{ color.description || '无描述' }}</span>
        </template>
      </div>
      <svg-icon
        v-if="['customSign'].includes(type)"
        icon-class="cebianlan_bianji"
        class-name="svg-icon-edit"
        @click.native="edit(index)"
      ></svg-icon>
    </el-col>
  </el-row>
</template>

<script>
let outerClass = {
  customSign: 'custom-sign-list'
}
export default {
  props: {
    value: {
      type: String | Array,
      default: () => []
    },
    disabled: Boolean,
    isEmpTy: {
      type: Boolean,
      default: true
    },
    isCheckAll: Boolean,
    gutter: {
      type: Number,
      default: 12
    },
    type: {
      type: String,
      default: 'checkbox'
    },
    activeType: {
      type: String,
      default: 'tick'
    },
    showPopover: {
      type: Boolean,
      default: false
    },
    colors: {
      type: Array,
      default: () => [
        /*
         {
         colorValue: '#DCDEE0'
         },
         {
         colorValue: '#61BD50'
         },
         {
         colorValue: '#EED72F'
         },
         {
         colorValue: '#FDAA4A'
         },
         {
         colorValue: '#EC5947'
         },
         {
         colorValue: '#C378DF'
         },
         {
         colorValue: '#137ABF'
         }
         */
      ]
    },
    props: {
      type: Object,
      default() {
        return {
          label: 'colorValue',
          value: 'markId'
        }
      }
    }
  },
  data() {
    return {
      curVal: [],
      isEdit: {},
      selectIndex: 0
    }
  },
  computed: {
    outerClass({ gutter, type, isEmpTy }) {
      return [[`gutter-${gutter}`], outerClass[type], !isEmpTy && 'no-empty']
    },
    curColor() {
      return (color) => {
        const { colorValue, label } = color
        if (colorValue !== '#dcdee0') {
          const data = label ? label : '未设置'
          return data
        } else return '未'
      }
    },
    hasCheckAll({ disabled, isCheckAll }) {
      return !disabled && isCheckAll
    },
    handleClick({ disabled, type, validateSameColor }) {
      if (disabled) return () => {}
      if (type === 'customSign') {
        type = 'checkbox'
      }
      let clickFns = {
        checkbox: (color, index) => {
          let { curVal } = this
          let itemIndex = curVal.findIndex((item) => validateSameColor(item, color))
          if (itemIndex > -1) {
            curVal.splice(itemIndex, 1)
          } else {
            curVal.push(color)
          }
          this.oninput(curVal)
        }
      }
      return clickFns[type]
    },
    isActive({ validateSameColor }) {
      return (color) => {
        let { curVal } = this
        return curVal.some((item) => validateSameColor(item, color))
      }
    },
    validateSameColor({ props: { value } }) {
      return (colorA, colorB) => {
        return colorA[value] === colorB[value]
      }
    }
  },
  watch: {
    value: {
      handler(n) {
        this.curVal = n
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    onclick(color, index) {
      this.selectIndex = 1
      this.handleClick(color, index)
    },
    oninput(val) {
      if (val.length == 0) this.selectIndex = 0
      this.curVal = val

      let {
        props: { value }
      } = this
      this.$emit(
        'update:idList',
        val.map((item) => item[value])
      )

      this.$emit('input', val)
      this.$emit('change', val)
      console.log(val)
    },
    onchange(index) {
      console.log(index, this.colors)
      this.$emit('customSignChange', {
        index,
        color: this.colors[index]
      })
    },

    edit(index) {
      // console.log('edit')
      this.$set(this.isEdit, index, true)
      this.$nextTick(function () {
        // console.log(this.$refs[`editInput${index}`])
        this.$refs[`editInput${index}`][0].select()
      })
    },

    console(...args) {
      console.log(args)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-popover {
    text-align: center;
  }
}
.checkbox-all {
  margin-right: 10px;
}
.active {
  color: $color-primary;
}

$tag-width: 20px;
$tag-height: 20px;
$tag-item-pt: ($form-line-height - $tag-height) / 2;
$tag-item-pb: ($form-line-height - $tag-height) / 2;
.tag-list {
  margin-top: -$tag-item-pt;
  margin-bottom: -$tag-item-pb;
  color: $color-content;
  .el-col {
    cursor: pointer;
  }
}
.tag-item {
  width: auto;
  padding-top: $tag-item-pt;
  padding-bottom: $tag-item-pb;
}
.tag-item-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $tag-width;
  height: $tag-height;
  line-height: 1;
  color: #fff;
  border-radius: 2px;

  // &.is-active {
  //   border: 1px solid #384edb;
  // }

  &.is-active {
    [class*=' el-icon-'],
    [class^='el-icon-'] {
      display: inline-block;
    }
  }
  [class*=' el-icon-'],
  [class^='el-icon-'] {
    display: none;
  }
}
.tag-list.gutter-6 {
  margin-top: -3px;
  margin-bottom: -3px;
  .tag-item {
    padding-top: 3px;
    padding-bottom: 3px;
  }
}
.el-form-item--small {
  .tag-item {
    width: auto;
    padding-top: (32px - $tag-height) / 2;
    padding-bottom: (32px - $tag-height) / 2;
  }
}

.custom-sign-list {
  .tag-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: -2px;
  }
  .tag-item:first-child {
    margin-top: -5px;
  }
  .tag-item:last-child {
    margin-bottom: 4px;
  }
  .svg-icon-edit {
    position: relative;
    right: -8px;
    font-size: 38px;
  }
  .tag-item-content {
    justify-content: flex-start;
    border-radius: 4px;
  }
  .tag-item-content__text {
    margin-left: 38px;
    margin-right: 8px;
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .el-icon-check {
    position: absolute;
    left: 16px;
    font-size: 20px;
  }
}
</style>
