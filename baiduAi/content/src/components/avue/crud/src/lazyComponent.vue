<script>
import ElSkeleton from './skeleton/src'
import { getScrollContainer, off, on } from 'element-ui/src/utils/dom'
import { isHtmlElement, isString } from 'element-ui/src/utils/types'
import throttle from 'throttle-debounce/throttle'
import { setPx, vaildData } from '@/components/avue/utils/util'
import { GetLastPromise } from '@/utils/promise'
import { createGlobalWait } from '@/components/avue/utils/globalWait'
const globalWait = createGlobalWait()

// 不支持动态设置lazy，必须在组件创建时设置为懒加载
export default {
  name: 'LazyComponent',
  props: {
    sign: {},
    lazy: Boolean,
    lazyMounted: Boolean,
    scrollContainer: {},
    direction: String,
    isOnePage: Boolean,
    height: {},
    useSkeleton: {
      type: Boolean,
      default: true
    },
    rows: Number
  },
  data() {
    return {
      isMounted: false,
      finalLazy: !!this.lazy
    }
  },
  computed: {
    finalScrollContainer({ scrollContainer }) {
      if (!scrollContainer) return this.isOnePage ? '.el-table__body-wrapper' : '.app-container'
      if (scrollContainer === 'elTable') return '.el-table__body-wrapper'
      return scrollContainer
    },
    finalDirection() {
      return this.direction || (this.isElTable ? 'vertical' : '') || 'both'
    },
    isElTable() {
      return this.finalScrollContainer === '.el-table__body-wrapper'
    },
    style() {
      return {
        height: setPx(this.finalHeight)
      }
    },
    finalHeight() {
      return vaildData(this.height, this.useSkeleton ? 16 : '')
    },
    finalRows() {
      return vaildData(this.rows, this.finalHeight >= 48 ? 3 : 1)
    },

    /*
     * 同一水平线上的组件视为一个集合，将第一个组件设为滚动组件，滚动组件显示时，其余组件也显示
     * 使用sign来判断是否为同一个集合
     * 注意事项：不支持动态设置lazy，必须在组件创建时设置为懒加载
     * */
    lazyGather() {
      return {
        lazy: [this], // 未显示组件集合
        loaded: [], // 显示组件集合
        add: (_scrollContainer) => {
          if (!_scrollContainer._lazy) _scrollContainer._lazy = {}

          // 滚动组件
          let scrollVm = _scrollContainer._lazy[this.finalSign]
          if (scrollVm) {
            scrollVm.lazyGather.lazy.push(this)
            // 滚动组件显示后，后续的加入集合的组件也自动设置为显示
            if (!scrollVm.finalLazy) {
              this.lazyGather.load(_scrollContainer)
            }
            throw ''
          } else {
            // 设置为滚动组件
            _scrollContainer._lazy[this.finalSign] = this
          }
        },
        remove: (_scrollContainer) => {
          this.$once('hook:beforeDestroy', () => {
            delete _scrollContainer._lazy[this.finalSign]
          })
        },
        load: (_scrollContainer) => {
          const scrollVm = _scrollContainer._lazy[this.finalSign]
          for (const vm of scrollVm.lazyGather.lazy) {
            vm.finalLazy = false
            scrollVm.lazyGather.loaded.push(vm)
          }
          scrollVm.lazyGather.lazy.length = 0
        }
      }
    },
    finalSign({ sign }) {
      if (sign || sign === 0) return sign
      return +new Date()
    }
  },
  mounted() {
    this.lazyLoadGetLastPromise = new GetLastPromise().wait
    // 初始渲染完成后开启滚动监听
    setTimeout(() => {
      this.$nextTick(() => {
        this.isMounted = true
        this.finalLazy && this.addLazyLoadListener()
      })
    })
  },
  beforeDestroy() {
    this.lazyLoadGetLastPromise() // 再次调用lazyLoadGetLastPromise，中断执行，避免无效计算
    this.finalLazy && this.removeLazyLoadListener();
  },
  methods: {
    async handleLazyLoad() {
      /*
       * 滚动组件过多时，会产生大量冗余的计算，阻塞浏览器
       * 首先以globalWait切割计算，不至于阻塞
       * 然后再以lazyLoadGetLastPromise使得在多次调用中，只执行最后一次
       * 并且可以在组件销毁时，再次调用lazyLoadGetLastPromise，中断执行，避免无效计算
       * */
      try {
        await this.lazyLoadGetLastPromise(globalWait(this.loadWait))
      } catch (e) {
        return
      }

      // console.log('handleLazyLoad')
      if (this.isInContainer(this.$el, this._scrollContainer, this.finalDirection)) {
        this.finalLazy = false
        this.lazyGather.load(this._scrollContainer)
        this.removeLazyLoadListener()
      }
    },
    async addLazyLoadListener() {
      if (this.$isServer) return;

      const { finalScrollContainer } = this;
      let _scrollContainer = null;

      if (isHtmlElement(finalScrollContainer)) {
        _scrollContainer = finalScrollContainer;
      } else if (isString(finalScrollContainer)) {
        _scrollContainer = document.querySelector(finalScrollContainer);
      } else {
        _scrollContainer = getScrollContainer(this.$el);
      }

      if (_scrollContainer) {
        try {
          this.lazyGather.add(_scrollContainer)
        } catch (e) {
          return
        }

        /*
         * 在以el-table为滚动父元素时，需要判断el-table__body-wrapper的高度是否设置
         * el-table__body-wrapper的高度为动态设置，未设置时不滚动
         * */
        if (this.isElTable) {
          let count = 0
          const isSetHeight = async () => {
            if (count >= 4) return
            if (!_scrollContainer.style.height) {
              count++
              await this.$nextTick(isSetHeight)
            }
          }
          await isSetHeight()
        }

        this._scrollContainer = _scrollContainer;
        this._lazyLoadHandler = throttle(200, this.handleLazyLoad);
        on(_scrollContainer, 'scroll', this._lazyLoadHandler);
        this.loadWait = 0
        this.handleLazyLoad();
        this.loadWait = 200
      }
    },
    removeLazyLoadListener() {
      const { _scrollContainer, _lazyLoadHandler } = this;

      if (this.$isServer || !_scrollContainer || !_lazyLoadHandler) return;

      off(_scrollContainer, 'scroll', _lazyLoadHandler);
      this._scrollContainer = null;
      this._lazyLoadHandler = null;

      this.lazyGather.remove(_scrollContainer)
    },
    isInContainer(el, container, direction) {
      if (this.$isServer || !el || !container) return false;

      const elRect = el.getBoundingClientRect();
      let containerRect;

      if ([window, document, document.documentElement, null, undefined].includes(container)) {
        containerRect = {
          top: 0,
          right: window.innerWidth,
          bottom: window.innerHeight,
          left: 0
        };
      } else {
        containerRect = container.getBoundingClientRect();
      }

      const isInContainer = {
        horizontal: () => elRect.right > containerRect.left && elRect.left < containerRect.right,
        vertical: () => elRect.top < containerRect.bottom && elRect.bottom > containerRect.top
      }
      if (isInContainer[direction]) return isInContainer[direction]()
      return Object.values(isInContainer).every(fn => fn())
    }
  },
  render() {
    if (!this.isMounted) return

    const loading = this.finalLazy
    const style = loading ? this.style : undefined // 占位高度，在没有内容的时候，给个高度撑开元素
    if (!this.lazyMounted && this.useSkeleton) {
      return <ElSkeleton loading={ loading } style={ style } rows={ this.finalRows } scopedSlots={ this.$scopedSlots }/>
    }

    return loading
      ? <div style={ style }></div>
      : (
        <div>
          { this.$scopedSlots.default?.() }
        </div>
      )
  }
}
</script>