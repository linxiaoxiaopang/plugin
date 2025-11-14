<template>
  <div>
    <template v-if="uiLoading">
      <div :class="['el-skeleton', animated ? 'is-animated' : '', ]" v-bind="$attrs">
        <template v-for="i in count">
          <slot v-if="loading" name="template">
            <el-skeleton-item
              v-for="item in rows"
              :key="`${i}-${item}`"
              :class="{
                'el-skeleton__paragraph': item !== 1,
                'is-first': item === 1,
                'is-last': item === rows && rows > 1,
              }"
              variant="p"
            />
          </slot>
        </template>
      </div>
    </template>
    <template v-else>
      <slot v-bind="$attrs"></slot>
    </template>
  </div>
</template>
<script>
import ElSkeletonItem from './item'
export default {
  name: 'ElSkeleton',
  components: { ElSkeletonItem },
  props: {
    animated: {
      type: Boolean,
      default: false
    },
    count: {
      type: Number,
      default: 1
    },
    rows: {
      type: Number,
      default: 4
    },
    loading: {
      type: Boolean,
      default: true
    },
    throttle: {
      type: Number,
      default: 0
    }
  },
  watch: {
    loading: {
      handler(loading) {
        if (this.throttle <= 0) {
          this.uiLoading = loading;
          return;
        }
        if (loading) {
          clearTimeout(this.timeoutHandle);
          this.timeoutHandle = setTimeout(() => {
            this.uiLoading = this.loading;
          }, this.throttle);
        } else {
          this.uiLoading = loading;
        }
      },
      immediate: true
    }
  },
  data() {
    return {
      uiLoading: this.throttle <= 0 ? this.loading : false
    };
  }
};
</script>
<style lang="scss" scoped>
.el-skeleton {
  width: 100%;
  text-align: left;
}

::v-deep {
  @keyframes el-skeleton-loading {
    0% {
      background-position: 100% 50%
    }

    to {
      background-position: 0 50%
    }
  }

  .el-skeleton__first-line,.el-skeleton__paragraph {
    height: 16px;
    margin-top: 16px;
    background: #f2f2f2
  }

  .el-skeleton.is-animated .el-skeleton__item {
    background: linear-gradient(90deg,#f2f2f2 25%,#e6e6e6 37%,#f2f2f2 63%);
    background-size: 400% 100%;
    animation: el-skeleton-loading 1.4s ease infinite
  }

  .el-skeleton__item {
    background: #f2f2f2;
    display: inline-block;
    height: 16px;
    border-radius: 4px;
    width: 100%
  }

  .el-skeleton__circle {
    border-radius: 50%;
    width: 36px;
    height: 36px;
    line-height: 36px
  }

  .el-skeleton__circle--lg {
    width: 40px;
    height: 40px;
    line-height: 40px
  }

  .el-skeleton__circle--md {
    width: 28px;
    height: 28px;
    line-height: 28px
  }

  .el-skeleton__button {
    height: 40px;
    width: 64px;
    border-radius: 4px
  }

  .el-skeleton__p {
    width: 100%
  }

  .el-skeleton__p.is-last {
    width: 61%
  }

  .el-skeleton__p.is-first {
    width: 33%
  }

  .el-skeleton__text {
    width: 100%;
    height: 13px
  }

  .el-skeleton__caption {
    height: 12px
  }

  .el-skeleton__h1 {
    height: 20px
  }

  .el-skeleton__h3 {
    height: 18px
  }

  .el-skeleton__h5 {
    height: 16px
  }

  .el-skeleton__image {
    width: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0
  }

  .el-skeleton__image svg {
    fill: #dcdde0;
    width: 22%;
    height: 22%
  }
}
</style>