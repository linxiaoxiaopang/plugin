/* eslint-disable */
import { isArray, pull, cloneDeep } from 'lodash'

export default function (option = {}) {
  let dataAttrs = {}
  option = isArray(option) ? option : [option]
  option.forEach((item) => (item.relation || 'child') === 'child' && item.dataAttrs && Object.assign(dataAttrs, item.dataAttrs))
  return {
    data() {
      return {
        ...dataAttrs
      }
    },
    computed: {
      getComponents() {
        return {
          child: (componentName, instance = this) => {
            let child = instance.$refs[componentName]
            if (child) return child
            
            let children = [...instance.$children]
            child = children.shift()
            let name = child?.$options.componentName
            
            while (child && (!name || name !== componentName)) {
              children = children.concat(child.$children)
              
              child = children.shift()
              name = child?.$options.componentName
            }
            
            return child
          },
          parent: (componentName) => {
            return this.$attrs.parent || this.$attrs.sup_this || this.$parent
            
            
            let parent = this.$attrs.parent || this.$attrs.sup_this
            if (parent) return parent
            
            parent = this.$parent || this.$root
            let name = parent.$options.componentName
            
            while (parent && (!name || name !== componentName)) {
              parent = parent.$parent
              
              if (parent) {
                name = parent.$options.componentName
              }
            }
            
            return parent || this.$parent
          }
        }
      }
    },
    created() {
      option.forEach(this.getCompProp)
    },
    methods: {
      getCompProp(option) {
        if (!option.name) return
        const { relation, componentName = option.name } = option
        
        const fn = () => {
          let target
          let source
          if (relation === 'parent') {
            source = this
            target = this.getComponents.parent(componentName)
          } else if (relation === 'grand') {
            target = this.getComponents.parent(componentName)
            source = this.getComponents.child(componentName)
          } else {
            target = this
            source = this.getComponents.child(componentName)
          }
          
          if (!target || !source) return false
          
          this.$off('hook:beforeUpdate', fn)
          this.$off('hook:updated', fn)
          this.setProxy({ target, source, ...option })
        }
        
        if (fn() === false) {
          this.$on('hook:beforeUpdate', fn)
          this.$on('hook:updated', fn)
        }
      },
      setProxy(option) {
        if (!option.name) return
        
        this.setProxyComp(option)
        if (option.attrs || option.dataAttrs) {
          this.setPropFromProxy(option)
        }
      },
      setProxyComp({ target, name, source }) {
        const proxy = this.initProxy(target, name)
        if (!proxy.$sourceList) return
        // 避免重复取值
        if (!proxy.$sourceList.includes(source)) proxy.$sourceList.push(source)
        // 在实例销毁后移除source
        source.$on('hook:destroyed', () => {
          pull(proxy.$sourceList, source)
          if (!proxy.$sourceList.length) target[name] = null
        })
      },
      setPropFromProxy({ target, attrs, dataAttrs, name, isCloneDeep }) {
        const proxy = this.initProxy(target, name)
        const { $sourceList } = proxy
        attrs = this.normalizeAttrs(attrs, dataAttrs)
        // target属性值来源于$sourceList里值不为undefined的source
        for (const source of $sourceList) {
          const unwatchs = this.createWatcher({ target, source, attrs, isCloneDeep })
          // 使已经监听的属性不被覆盖
          Object.keys(unwatchs).forEach((key) => delete attrs[key])
          
          if (!Object.keys(attrs).length) break
        }
      },
      createWatcher({ target, source, attrs, dataAttrs, isCloneDeep }) {
        // proxy_sources：用于避免重复创建监听
        // proxy_unwatchs：用于注销上次监听，避免多次监听
        let { proxy_unwatchs, proxy_sources } = target
        if (!proxy_unwatchs) proxy_unwatchs = target.proxy_unwatchs = {}
        if (!proxy_sources) proxy_sources = target.proxy_sources = {}
        
        attrs = this.normalizeAttrs(attrs, dataAttrs)
        
        const unwatchs = {}
        for (const targetProp in attrs) {
          const sourceProp = attrs[targetProp]
          if (source[sourceProp] === undefined || proxy_sources[targetProp] === source) continue
          
          // 注销旧watcher
          proxy_unwatchs[targetProp]?.()
          proxy_sources[targetProp] = source
          
          unwatchs[targetProp] = proxy_unwatchs[targetProp] = source.$watch(
            sourceProp,
            (val) => {
              target[targetProp] = isCloneDeep ? cloneDeep(val) : val
            },
            { immediate: true, deep: true }
          )
        }
        
        // 当 source 实例销毁时，delete target 上 来自 source 的 prop
        source.$on('hook:destroyed', () => {
          proxy_unwatchs = target.proxy_unwatchs
          proxy_sources = target.proxy_sources
          for (const targetProp in proxy_sources) {
            if (proxy_sources[targetProp] === source) {
              proxy_unwatchs[targetProp]?.()
              delete proxy_unwatchs[targetProp]
              delete proxy_sources[targetProp]
              target._isVue ? target[targetProp] = null : this.$delete(target, targetProp)
            }
          }
        })
        
        return unwatchs
      },
      normalizeAttrs(attrs, dataAttrs) {
        // 允许别名 { [targetProp]: sourceProp }
        if (isArray(attrs)) {
          attrs = attrs.reduce((prev, next) => {
            prev[next] = next
            return prev
          }, {})
        }
        return {
          ...attrs,
          ...(dataAttrs && this.normalizeAttrs(Object.keys(dataAttrs)))
        }
      },
      
      initProxy(target, name) {
        let proxy = target[name]
        if (proxy) return proxy
        
        return target[name] = new Proxy({ $sourceList: [] },{
          get: function (target, key) {
            let value = target[key]
            if (value !== undefined) return value
            
            for (const source of target.$sourceList) {
              value = source[key]
              if (value !== undefined) return value
            }
          }
        })
      }
    }
  }
}