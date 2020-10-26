import { remove } from "../../shared/util";
import { getFirstComponentChild } from "../vdom/helpers/get-first-component-child";
import { isRegExp } from "util";

function getComponentName(opts) {
  // 如果组件有name 就返回name 否则返回标签名
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}

function pruneCache(keepAliveInstance, filter) {
  // 取出相应变量
  const { cache, keys, _vnode } = keepAliveInstance
  // 遍历缓存中的key
  for (const key in cache) {
    // 取出key对应的节点
    const cachedNode = cache[key]
    // 如果节点不为空
    if (cachedNode) {
      // 获取组件的名字
      const name = getComponentName(cachedNode.componentOptions)
      // 如果名字不满足过滤器 就直接删掉
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

function pruneCacheEntry (cache, key, keys, current) {
  // 拿出当前缓存
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    cached.componentInstance.$destroy()
  }
  // 移除当前缓存
  cache[key] = null
  // 将当前key在keys中移除
  remove(keys, key)
}

const patternTypes = [String, RegExp, Array]
// 创建一个全局组件 使用了LRU 进行实现
export default {
  // 组件名
  name: 'keep-alive',
  // 抽象组件 不会渲染虚拟节点
  abstract: true,

  props:{
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created () {
    // 缓存vnode
    this.cache = Object.create(null)
    // 保存缓存对应的key值
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    // 通过监听include和exclude的变化来整理缓存
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val =>{
      pruneCache(this, name => !matches(val, name))
    })
  },

  // 利用渲染函数的形式
  render () {
    // 拿到默认插槽
    const slot = this.$slots.default
    // 默认插槽的第一个组件
    const vnode = getFirstComponentChild(slot)
    const componentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      const name = getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        // 不在include中
        (include && (!name || !matches(include, name))) ||
        // 在exclude中
        (exclude && name && matches(exclude, name))
      ) {
        // 不用缓存 直接返回vnode
        return vnode
      }

      const {cache, keys } = this
      // 如果vnode有key就用 没有就用组件的cid拼接
      const key = vnode.key == null
      ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
      : vnode.key

      if (cache[key]) { // 命中缓存
        vnode.componentInstance = cache[key].componentInstance
        // 做LRU的处理
        // 移除key 并把key重新push进数组  即做一次整理
        remove(keys, key)
        keys.push(key)
      } else { // 缓存没有命中  即第一次
        // 将vnode存入缓存
        cache[key] = vnode
        // key push进数组
        keys.push(key)
        // 对缓存进行一个整体的清理 即将多出来的最老的删掉
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }
      // 做一个keep-alive的标识 这里是给子组件做标识 因为vnode是上面获取的第一个子组件
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
