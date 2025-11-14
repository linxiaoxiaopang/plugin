/* eslint-disable */
import store from '@/store'
import { getThumbnail, checkPermission } from '@/utils'
import handleClipboard from '@/directive/clipboard'
import { setPx } from '@/components/avue/utils/util'
import appendToBody from '@/directive/appendToBody'
import sortTable from '@/directive/sortTable'
import moveToDom from '@/directive/moveToDom'

export default {
  install: (Vue) => {
    // 获取原有属性 ie dom元素.currentStyle 火狐谷歌 window.getComputedStyle(dom元素, null);
    const getStyle = (function () {
      if (window.document.currentStyle) {
        return (dom, attr) => dom.currentStyle[attr]
      } else {
        return (dom, attr) => getComputedStyle(dom, false)[attr]
      }
    })()
    Vue.directive('el-drag-dialog', {
      bind(el, binding, vnode) {
        if (binding.value === false) return
        const dialogHeaderEl = el.querySelector('.el-dialog__header')
        const dragDom = el.querySelector('.el-dialog')
        dialogHeaderEl.style.cssText += ';cursor:move;'
        dragDom.style.cssText += ';top:0px;'

        dialogHeaderEl.onmousedown = (e) => {
          // 鼠标按下，计算当前元素距离可视区的距离
          const disX = e.clientX - dialogHeaderEl.offsetLeft
          const disY = e.clientY - dialogHeaderEl.offsetTop

          const dragDomWidth = dragDom.offsetWidth
          const dragDomHeight = dragDom.offsetHeight

          const screenWidth = document.body.clientWidth
          const screenHeight = document.body.clientHeight

          const minDragDomLeft = dragDom.offsetLeft
          const maxDragDomLeft = screenWidth - dragDom.offsetLeft - dragDomWidth

          const minDragDomTop = dragDom.offsetTop
          const maxDragDomTop = screenHeight - dragDom.offsetTop - dialogHeaderEl.offsetHeight

          // 获取到的值带px 正则匹配替换
          let styL = getStyle(dragDom, 'left')
          let styT = getStyle(dragDom, 'top')

          if (styL.includes('%')) {
            //eslint-disable-next-line
            styL = +document.body.clientWidth * (+styL.replace(/%/g, '') / 100)
            //eslint-disable-next-line
            styT = +document.body.clientHeight * (+styT.replace(/%/g, '') / 100)
          } else {
            styL = +styL.replace(/px/g, '')
            styT = +styT.replace(/px/g, '')
          }

          document.onmousemove = function (e) {
            // 通过事件委托，计算移动的距离
            let left = e.clientX - disX
            let top = e.clientY - disY

            // 边界处理
            if (-left > minDragDomLeft) {
              left = -minDragDomLeft
            } else if (left > maxDragDomLeft) {
              left = maxDragDomLeft
            }

            if (-top > minDragDomTop) {
              top = -minDragDomTop
            } else if (top > maxDragDomTop) {
              top = maxDragDomTop
            }

            // 移动当前元素
            dragDom.style.cssText += `;left:${left + styL}px;top:${top + styT}px;`

            // emit onDrag event
            vnode.child.$emit('dragDialog')
          }

          document.onmouseup = function (e) {
            document.onmousemove = null
            document.onmouseup = null
          }
        }
      }
    })
    Vue.directive('p', {
      inserted(el, binding) {
        const { value = [] } = binding
        const isSuper = store.getters.is_super
        if (isSuper) {
          return isSuper
        }
        const hasPermission = checkPermission(value)
        if (!hasPermission) {
          el.parentNode.removeChild(el)
        }
        return hasPermission
      }
    })

    Vue.directive('pwd-off', {
      bind(el, binding) {
        if (binding.value === false) return
        var input = el.getElementsByClassName('el-input__inner')[0]
        if (binding.value === 'own') {
          input = el
        }
        input.onfocus = onfocus
        input.onblur = onblur
        input.onblur()
        // console.log(el, input)

        function onfocus() {
          // console.log('onfocus')
          input.addEventListener('click', handleClick)
          input.addEventListener('keydown', handleKeydown)
          input.addEventListener('mousedown', handleMousedown)
          //使用setTimeout，告诉JS是异步执行，这样子，就可以阻止第一次点击获取焦点时，下拉用户密码清
          //单的框的出现
          setTimeout(() => {
            //获取焦点时 同时去除只读，这样可以获取光标，进行输入
            input.removeAttribute('readonly')
          }, 300)
        }
        function onblur() {
          // console.log('onblur')
          //失去焦点立马更新为只读
          input.setAttribute('readonly', 'true')
        }
        function handleClick(e) {
          //为什么先失去焦点，在获取焦点，这样子可以避免第二次或更多次连续点击输入框时，出现的用户密
          // 码清单的框可以快速去除
          // 绑定为own时不点击，否则6位密码框会有bug，不会自动跳回未输入的框上
          if (binding.value === 'own') return
          if (e.type === 'click') {
            input.blur()
            input.focus()
          }
        }
        function handleKeydown(e) {
          if (e.type === 'keydown') {
            const keyCode = e.keyCode
            const passwordText = input
            const len = passwordText.value.length
            if ([8, 46].includes(keyCode)) {
              //backspace 和delete
              if (len === 1) {
                passwordText.value = ''
                return false
              }
              if (e.target.selectionStart === 0 && e.target.selectionEnd === len) {
                passwordText.value = ''
                return false
              }
            } else if ((len === 0 && [32].includes(keyCode)) || e.ctrlKey) {
              input.blur()
              input.focus()
            }
            return true
          }
        }
        function handleMousedown(e) {
          if (e.type === 'mousedown') {
            input.blur()
            input.focus()
          }
        }
        // 绑定为own时先对每个输入框进行失焦和聚焦，后续再点击不会出现自动输入的提示
        if (binding.value === 'own') {
          input.blur()
          input.focus()
        }
      }
    })

    Vue.directive('formatUrl', {
      inserted(el, binding) {
        const { file } = binding.value
        let url = file.url || file.path
        if (url) {
          if (!/^http/.test(url)) {
            //eslint-disable-next-line
            return (el.src = `${serverRootPath}${url}`)
          }
          return (el.src = url)
        }
        getThumbnail(file).then((res) => {
          const { url } = res
          el.src = url
        })
      }
    })
    // 滚动条指令
    Vue.directive('scrollTop', {
      inserted(el, binding, vnode) {
        if (binding.value >= 1 || binding.value <= 0) {
          console.error(new Error('指令 v-scrollTop 绑定的值要在 0 到 1 之间'))
          return
        }
        // 获取元素的高度
        const elH = el.offsetHeight
        // 获取 提示按钮出来时的位置
        let btnH = 0
        if (binding.value) {
          btnH = binding.value * elH
          if (btnH > 500) {
            btnH = 500
          }
        } else {
          btnH = 0.2 * elH
        }
        // 获取元素的父元素（也就是有 overflow 属性的那个元素）
        const parentEl = el.parentNode
        // 给父元素添加一个滚动条缓动的样式
        parentEl.style.scrollBehavior = 'smooth'
        // 创建一个兄弟元素插入父元素中
        // 创建元素
        const brotherEl = document.createElement('div')
        // 给创建的元素样式类来调整样式
        brotherEl.className = 'scroll-top-class el-icon-top'
        // 插入父元素
        parentEl.appendChild(brotherEl)
        // 给兄弟元素添加一个点击事件
        brotherEl.addEventListener('click', () => {
          parentEl.scrollTop = 0
        })

        // 对父元素的滚动事件进行监听
        parentEl.addEventListener('scroll', () => {
          // 滚动的位置到设置的地方就显示
          if (parentEl.scrollTop >= btnH) {
            brotherEl.style.opacity = 1
            brotherEl.style.height = '40px'
            brotherEl.style.width = '40px'
            brotherEl.style.fontSize = '30px'
            brotherEl.style.lineHeight = '40px'
          } else {
            // 否则就隐藏
            brotherEl.style.opacity = 0
            brotherEl.style.height = '1px'
            brotherEl.style.width = '1px'
            brotherEl.style.fontSize = '1px'
            brotherEl.style.lineHeight = '1px'
          }
        })
      }
    })
    /*Vue.directive('parseImgSrc', function (el, binding, vnode) {
      let src = parseImgSrc(binding.value)
      let elImage = vnode.child
      elImage.$on('error', function () {
        const img = new Image()
        img.onload = () => {
          el.replaceChild(img, el.firstChild)
        }
        img.onerror = () => {
          img.src = require('@/assets/images/default.png')
        }
        img.src = src
        img.className = 'el-image__inner'
        img.style.objectFit = 'contain'
      })
      // console.log(el, binding, vnode)
    })*/

    Vue.directive('copy', {
      bind(el, { value }) {
        el.handler = (e) => {
          // console.log('value', value)
          // console.log('e', e)
          handleClipboard(value, e)
        }
        el.addEventListener('click', el.handler) // 绑定点击事件
        el.click()
      },
      update(el, { value }) {
        el.removeEventListener('click', el.handler)
        el.handler = (e) => {
          // console.log('value', value)
          // console.log('e', e)
          handleClipboard(value, e)
        }
        el.addEventListener('click', el.handler) // 绑定点击事件
        // el.click()
      },
      // 指令与元素解绑的时候，移除事件绑定
      unbind(el) {
        el.removeEventListener('click', el.handler)
      }
    })

    // el-table 列宽自适应
    function getDOMPx(width, value) {
      if (value.includes('%')) {
        value = +width * (+value.replace(/%/g, '') / 100)
      } else {
        value = +value.replace(/px/g, '')
      }
      return value
    }
    function adjustOperationWidth(table, colName = '', tableRef) {
      const colgroup = table.querySelector('colgroup')
      const colDefs = [...colgroup.querySelectorAll('col')]
      colDefs.forEach((col) => {
        const clsName = col.getAttribute('name')
        // console.log(clsName)
        const cells = [
          ...table.querySelectorAll(['td', clsName, colName].filter(Boolean).join('.')),
          ...table.querySelectorAll(['th', clsName, colName].filter(Boolean).join('.'))
        ]
        // 忽略加了"leave-alone"类的列
        if (cells[0]?.classList?.contains?.('leave-alone') || !cells.length) {
          return
        }
        let paddingLeftList = []
        let paddingRightList = []
        let cellWidthList = []
        const widthList = cells.map((el) => {
          let cellEl = el.querySelector('.cell')
          if (!cellEl) return 0
          let width = cellEl.scrollWidth
          cellWidthList.push(width)
          paddingLeftList.push(getDOMPx(width, getStyle(cellEl, 'paddingLeft')))
          paddingRightList.push(getDOMPx(width, getStyle(cellEl, 'paddingRight')))
          let widthList = []
          for (let i = 0; i < cellEl.children.length; i++) {
            widthList.push(cellEl.children[i].offsetWidth)
          }
          return Math.max(...widthList)
        })
        // console.log(widthList)
        const maxCellWidth = Math.max(...cellWidthList)
        const max = Math.max(...widthList)
        const padding = Math.max(...paddingLeftList) + Math.max(...paddingRightList)
        let finalWidth = max + padding
        if (maxCellWidth > finalWidth) return
        // console.log(tableRef)
        if (tableRef) {
          tableRef.$nextTick(function () {
            // console.log(clsName)
            let columns = tableRef.$refs.table?.columns
            if (!columns) return
            let curCol = columns.find((col) => col.id === clsName)
            // console.log(finalWidth, curCol)
            finalWidth > curCol?.realWidth && (curCol.width = finalWidth)
          })
        } else {
          table.querySelectorAll(`col[name=${clsName}]`).forEach((el) => {
            el.setAttribute('width', finalWidth)
          })
        }

        if (tableRef) {
          tableRef.$nextTick(function () {
            tableRef.$refs.table?.doLayout()
          })
        }
      })
    }
    Vue.directive('fit-operation', {
      inserted(el, binding, vnode) {
        if (!binding.value) return

        setTimeout(() => {
          adjustOperationWidth(el, binding.value, vnode.child)
        }, 300)
      },
      componentUpdated(el, binding, vnode) {
        if (!binding.value) return

        el.classList.add('r-table')
        setTimeout(() => {
          adjustOperationWidth(el, binding.value, vnode.child)
        }, 300)
      }
    })
    Vue.directive('fit-columns', function (el) {
      // console.log(el)
      let cells = el.querySelectorAll('td .cell')
      let heightList = [0]
      for (let i = 0, len = cells.length; i < len; i++) {
        heightList.push(cells[i].offsetHeight)
      }
      // console.log(heightList)
      let maxHeight = Math.max(...heightList)
      if (maxHeight <= 47) {
        el.classList.add('normal-table')
      } else if (maxHeight > 56) {
        el.classList.add('cell-vertical-top')
      }
      console.log(maxHeight)
    })

    //下拉菜单 hover方法，显示和隐藏
    Vue.directive('dropdown-menu-hover', {
      bind(el, binding) {
        const [domBtn, domDropdown] = el.children
        const classList = domBtn.classList
        let { value } = binding
        if (!value) {
          value = ['global-dom-dropdown_enter', 'global-dom-dropdown-btn_active']
        }
        el.mouseenterHandler = () => {
          // console.log('我被', domBtn, domDropdown)
          classList.add(...value)
        }
        el.mouseleaveHandler = () => {
          // console.log('mouseleaveHandler', domBtn, domDropdown)
          classList.remove(...value)
        }

        el.domDropdown = domDropdown
        el.domBtn = domBtn
        domDropdown.addEventListener('mouseenter', el.mouseenterHandler)
        domBtn.addEventListener('mouseenter', el.mouseenterHandler)
        domDropdown.addEventListener('mouseleave', el.mouseleaveHandler)
        domBtn.addEventListener('mouseleave', el.mouseleaveHandler)
      },

      // 指令与元素解绑的时候，移除事件绑定
      unbind(el) {
        el.domDropdown.removeEventListener('mouseenter', el.mouseenterHandler)
        el.domDropdown.removeEventListener('mouseleave', el.mouseleaveHandler)
        el.domBtn.removeEventListener('mouseenter', el.mouseenterHandler)
        el.domBtn.removeEventListener('mouseleave', el.mouseleaveHandler)
      }
    })

    Vue.directive('drag', function (el, binding) {
      let oDiv = el //当前元素
      oDiv.style.cursor = 'move'
      oDiv.onmousedown = function (e) {
        e.preventDefault()
        //鼠标按下，计算当前元素距离可视区的距离
        const { top, left } = oDiv.getBoundingClientRect()
        let oX = e.clientX
        let oY = e.clientY
        // 计算两边坐标

        document.onmousemove = function (e) {
          let l = left + e.clientX - oX
          let t = top + e.clientY - oY
          //移动当前元素
          // oDiv.style.transform = 'none'
          oDiv.style.left = l + 'px'
          oDiv.style.top = t + 'px'
          oDiv.style.right = 'auto'
          oDiv.style.bottom = 'auto'
        }
        // 鼠标停止移动时，事件移除
        document.onmouseup = function (e) {
          document.onmousemove = null
          document.onmouseup = null
        }
      }
    })

    Vue.directive('group', function (el, binding) {
      let items = el.getElementsByClassName(binding.value)
      // console.log(el, items)
      let maxWidth = 0
      for (let i = 0, len = items.length; i < len; i++) {
        maxWidth = Math.max(maxWidth, items[i].offsetWidth)
      }
      // console.log(maxWidth)
      if (+el.getAttribute('maxWidth') === maxWidth || maxWidth === 0) return
      el.setAttribute('maxWidth', maxWidth)
      for (let i = 0, len = items.length; i < len; i++) {
        items[i].style.width = setPx(maxWidth || 'auto')
      }
    })

    //dom添加到body
    Vue.directive('appendToBody', appendToBody)

    //拖拽排序
    Vue.directive('sortTable', sortTable)
    Vue.directive('moveToDom', moveToDom)
  }
}
