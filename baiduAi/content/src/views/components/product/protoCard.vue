<template>
  <router-link
    v-bind="domObj"
    :to="`/design/detail?id=${this.data.id}`"
    :class="['protoCardComponent', 'hover']"
    @click="linkToDetail"
    v-loading="loading"
  >
    <div class="pic-wrapper">
      <defaultImg class="global-image_multiply" :src="cover + PICSIZE['mid']"></defaultImg>
      <div class="pic-dialog">
        <CollectIcon
          v-if="showCollect"
          :data="data"
          :isPic="true"
          customClass="love"
          @click.native.prevent.stop="love"
        />
        <router-link
          :to="`/design/designContainer?id=${this.baseSizeId}&protoId=${this.data.id}`"
          v-if="hasDesign"
          class="btn"
          @click.prevent.stop="design"
        >
          <i class="el-icon-top-right"></i>
          <span class="btn-txt">点击去定制</span>
        </router-link>
      </div>
    </div>
    <div class="info">
      <div class="color-name">
        <div class="name flex-middle">
          <span>{{ data.chineseName }}</span>
          <span v-if="data.newProNum < 3" class="iconfont icon-icon-test-copy"></span>
        </div>
        <div class="chunk-color_list">
          <div
            class="chunk-color_item"
            :style="{ background: item.colorValue }"
            :key="index"
            v-for="(item, index) in colors"
          ></div>
        </div>
      </div>

      <div class="colors">
        <div
          class="color-wrapper"
          :key="index"
          v-for="(color, index) in sliceColors"
          @click.prevent.stop="curActive = index"
        >
          <el-image
            :class="['color', 'global-image_multiply']"
            style="width: 100%; height: 100%"
            fit="contain"
            :src="color.displayImageUrl"
          ></el-image>
        </div>
        <span class="more-num" v-if="moreNum"> +{{ moreNum }}</span>
      </div>
      <div class="flex-between money">
        <span>￥{{ parseNumber(restart) }} 起</span>
        <el-tooltip v-if="permissionList.supplierName" placement="bottom-end" popper-class="design-card-wrapper">
          <div slot="content">
            {{ supplierName }}
          </div>
          <span class="text-cut">
            {{ supplierName }}
          </span>
        </el-tooltip>
      </div>
    </div>
  </router-link>
</template>

<script>
import CollectIcon from '@/views/components/collectIcon'

import { PICSIZE } from '@/utils/constant'
import collectionPrivateMixin from '@/mixins/business/collectionPrivateMixin'
import { mapMutations } from 'vuex'
import { checkPermission, flatMapDeepByArray } from '@/utils'

const COLOR_COUNT = 4

export default {
  mixins: [collectionPrivateMixin],

  components: {
    CollectIcon
  },

  props: {
    data: {
      type: Object,
      required: true
    },
    sup_this: {
      type: Object,
      required: true
    },

    hasCollect: Boolean, //收藏
    hasCancelCollect: Boolean, //取消收藏
    hasDesign: Boolean //前往定制
  },
  data() {
    return {
      PICSIZE,
      curActive: 0,
      domObj: {},
      permissionList: {
        supplierName: checkPermission(['business:design:supplierName'])
      }
    }
  },
  computed: {
    //收藏按钮显示隐藏
    showCollect({ hasCollect, hasCancelCollect, data }) {
      if (data.collect) {
        return hasCancelCollect
      }
      return hasCollect
    },
    //参考尺码列表，第一个参考尺码Id
    baseSizeId() {
      const { referSizeList, referSizeId } = this.data
      if (Array.isArray(referSizeList) && referSizeList.length) {
        return referSizeList[0].id
      }
      return referSizeId
    },
    cover() {
      try {
        const { styleList = [] } = this.data
        const { styleDisplayImageList } = styleList[this.curActive]
        return styleDisplayImageList[0].displayImagePath || require('@/assets/images/default.png')
      } catch (err) {
        return require('@/assets/images/default.png')
      }
    },

    colors() {
      const { styleList = [] } = this.data
      return (styleList || []).map(({ color, displayImageUrl }) => {
        return {
          ...color,
          displayImageUrl
        }
      })
    },

    sliceColors({ colors }) {
      try {
        return (colors || []).slice(0, COLOR_COUNT)
      } catch {
        return []
      }
    },

    moreNum({ colors }) {
      try {
        return (colors || []).slice(COLOR_COUNT).length
      } catch {
        return false
      }
    },

    restart() {
      const { sizeList } = this.data
      const allPrice = []
      ;(sizeList || []).map(({ lowerLimitPrice }) => {
        allPrice.push(lowerLimitPrice)
      })

      if (allPrice.length) {
        return Math.min.apply(null, allPrice)
      } else {
        return '0'
      }
    },

    supplierName({ data }) {
      return flatMapDeepByArray(data, ['styleList', 'supplierList', 'supplierName']).join('、')
    }
  },
  created() {
    if (!checkPermission(['business:design:detail'])) {
      this.$set(this.domObj, 'is', 'div')
    }
  },
  methods: {
    ...mapMutations(['SET_PROTO_OBJ']),
    checkPermission,
    linkToDetail() {
      if (this.checkPermission(['business:design:detail'])) {
        this.$router.push(`/design/detail?id=${this.data.id}`)
      }

      this.SET_PROTO_OBJ(this.data)
    },
    design() {
      if (!this.baseSizeId) {
        this.$message.warning('参考尺码为空，跳转页面失败！')
        return
      }
      this.$router.push(`/design/designContainer?id=${this.baseSizeId}&protoId=${this.data.id}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.protoCardComponent {
  width: 100%;
  position: relative;
  display: block;
  border-radius: 4px;
  margin-bottom: 30px;
  transition: transform 0.5s;
  overflow: hidden;
  cursor: pointer;
  line-height: 1;
  color: #636c78;
  font-size: 14px;
  .text-cut {
    max-width: 50px;
  }
  .pic-wrapper {
    position: relative;
    padding-top: 86.6%;
    border: 1px solid $border-light-color;
    border-radius: 4px;
    ::v-deep {
      .default-img-popover-wrapper {
        position: absolute;
        top: 0;
        border: 1px solid $border-light-color;
      }
    }
    .el-image {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      // background: #fff;
      border-radius: 4px;
    }
    .pic-dialog {
      display: none;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      // background: rgba(0, 0, 0, 0.3);
      z-index: 10;
      .btn {
        display: flex;
        align-items: center;
        position: absolute;
        left: 50%;
        bottom: 16px;
        height: 32px;
        line-height: 32px;
        padding: 0 20px;
        padding-right: 25px;
        font-size: 12px;
        text-align: center;
        border-radius: 16px;
        color: #fff;
        background: rgba(84, 84, 84, 0.71);
        transform: translateX(-50%);
        i {
          margin-right: 5px;
          font-size: 18px;
          position: relative;
        }
        .btn-txt {
          white-space: nowrap;
        }
        @media only screen and (max-width: 1500px) {
          & {
            padding-left: 25px;
          }
          i {
            display: none;
          }
        }
      }
    }
    &:hover .pic-dialog {
      display: block;
    }
    .pic-dialog:hover {
      // background: rgba($color: #d1d1d1, $alpha: 0.5);
      display: block;
    }
  }
  .info {
    margin-top: 8px;
  }
  .money,
  .name {
    @include overflow;
    font-size: 14px;
    width: 100%;
    background: #fff;
    z-index: 100;
    font-size: 14px;
    line-height: 16px;
  }
  .name {
    display: inline-block;
    width: calc(100% - 40px);
  }
  .icon-icon-test-copy {
    color: rgb(0, 167, 0);
    font-size: 24px;
    position: absolute;
    right: 8px;
  }
  .money span {
    font-size: 16px;
    color: $color-title;
  }
  .money {
    margin-top: 8px;
  }
  .colors {
    display: flex;
    align-items: center;
    margin-top: 5px;
    display: none;
    width: 100%;
    overflow: auto;
    white-space: nowrap;
    padding: 0;
    .color-wrapper {
      position: relative;
      display: inline-block;
      width: 35px;
      height: 35px;
      padding: 0;
      white-space: nowrap;
      margin: 0;
      margin-right: 6px;
      border: 1px solid $border-color;
      box-sizing: border-box;
    }
    .color {
      top: 0;
      left: 0;
      position: absolute;
      width: 100%;
      height: 100%;
      border: none;
    }
    .color:hover {
      opacity: 0.8;
    }
    .color.active {
      // border-color: $color-danger;
    }
  }
  .more-num {
    color: #636c78;
    font-size: 16px;
  }
}
.protoCardComponent:hover {
  color: #636c78;
  .color-name {
    display: none;
  }
  .colors {
    display: flex;
  }
}
.chunk-color_list {
  white-space: nowrap;
}
.chunk-color_item {
  display: inline-block;
  border: 1px solid $border-color;
  width: 15px;
  height: 15px;
}
.color-name {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 35px;
}
</style>

<style lang="scss">
.design-card-wrapper {
  max-width: 200px;
  line-height: 20px;
}
</style>
