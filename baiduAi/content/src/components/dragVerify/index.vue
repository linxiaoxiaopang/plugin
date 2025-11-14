<template>
  <!-- 登录拖拽   -->
  <div class="drag-verify-wrapper" ref="dragVerifyWrapper">
    <drag-verify
      v-if="!!dragVerifyWidth"
      ref="dragVerify"
      :key="key"
      :text="text"
      :successText="successText"
      :height="height"
      :width="dragVerifyWidth"
      :isPassing.sync="isPassing"
      :class="[isPassing && 'passing-verify_class']"
      progressBarBg="#35b871"
      completedBg="#35b871"
      handlerIcon="fa fa-angle-double-right"
      successIcon="iconfont icon-shejiqi_yiwancheng"
      @passcallback="handlePass"
    >
    </drag-verify>
  </div>
</template>

<script>
import dragVerify from 'vue-drag-verify2'
import { getUUID } from '@/utils'

export default {
  components: {
    dragVerify
  },

  model: {
    prop: 'value',
    event: 'changeValue'
  },

  props: {
    value: {
      type: Boolean,
      require: true
    },
    text: {
      type: String,
      default: '请按住滑块，拖动到最右边'
    },
    successText: {
      type: String,
      default: '验证通过'
    },
    height: {
      type: Number,
      default: 48
    },
    width: {
      type: Number
    }
  },

  data() {
    return {
      isPassing: false,
      dragVerifyWidth: this.width,
      key: getUUID()
    }
  },

  mounted() {
    this.initDragVerifyWidth()
  },

  watch: {
    width() {
      this.dragVerifyWidth = width
    },

    //v-model
    isPassing(newVal) {
      this.$emit('changeValue', newVal)
    },

    value(newVal) {
      this.isPassing = newVal
    }
  },

  methods: {
    /**
     * @description: 初始化宽度, 默认是父容器的宽度。
     * @param {*}
     * @return {*}
     */
    initDragVerifyWidth() {
      if (this.dragVerifyWidth) return
      this.dragVerifyWidth = this.$refs.dragVerifyWrapper.offsetWidth
    },

    /**
     * @description: 拖拽通过后触发的事件
     * @param {*}
     * @return {*}
     */
    handlePass() {
      // setTimeout(() => {
      //   this.errHandler()
      // }, 1000);
      this.$emit('handlePass')
    },

    /**
     * @description: 发生错误，更细key值刷新拖拽实例。
     * @param {*}
     * @return {*}
     */
    errHandler() {
      this.isPassing = false
      this.key = getUUID()
    }
  }
}
</script>

<style lang="scss" scoped>
.drag-verify-wrapper {
  width: 100%;
  height: 100%;
  user-select: none; //父容器设置，不可复制
  .passing-verify_class {
    ::v-deep {
      .dv_text {
        background: #35b871 !important;
      }
    }
  }

  ::v-deep {
    .drag_verify {
      .dv_handler.dv_handler.dv_handler {
        border: 1px solid #ccc;
        border-radius: 0 4px 4px 0;

        i.icon-shejiqi_yiwancheng {
          font-size: 24px;
          color: #35b871;
        }
      }
      .dv_text {
        font-size: 12px!important;
      }
    }
  }
}
</style>