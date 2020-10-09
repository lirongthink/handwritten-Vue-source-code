import { updateListeners } from "../vdom/helpers/update-listeners";
import { toArray } from "../../shared/util";

/**
 * 初始化事件
 * @param {Component} vm 当前组件实例
 */
export function initEvents(vm) {
  // 创建一个事件中心用来管理事件
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // 这里取出实例中存储的事件
  const listeners = vm.$options._parentListeners
  if (listeners) {
    // 调用更新组件侦听器方法
    updateComponentListeners(vm, listeners)
  }
}

// 用来存储当前实例
let target

/**
 * 添加自定义事件
 * @param {string} event 事件名
 * @param {Function} fn 回调函数
 */
function add(event, fn) {
  // 调用组件的$on方法
  target.$on(event, fn)
}

/**
 * 移除自定义事件
 * @param {string} event 事件名
 * @param {Function} fn 回调函数
 */
function remove(event, fn) {
  // 调用组件的$off方法
  target.$off(event, fn)
}

/**
 * 创建一个只执行一次的函数
 * @param {string} event 事件名
 * @param {Function} fn 回调函数
 */
function createOnceHandler (event, fn) {
  const _target = target
  // 返回一个新的函数
  return function onceHandler () {
    // 执行一次函数
    const res = fn.apply(null, arguments)
    if (res !== null) {
      // 将回调移除
      _target.$off(event, onceHandler)
    }
  }
}

/**
 * 控制当前实例并调用更新事件监听器方法
 * @param {Component} vm 当前实例
 * @param {Object} listeners 侦听器回调列表
 * @param {object} oldListeners 旧的侦听器回调列表
 */
export function updateComponentListeners(vm, listeners, oldListeners) {
  // 设置当前实例
  target = vm
  // 调用更新函数方法
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  // 移除当前实例
  target = undefined
}

export function eventsMixin(Vue) {
  const hookRE = /^hook:/
  Vue.prototype.$on = function (event, fn) {
    // 取出实例
    const vm = this
    // 如果传入的事件是一个数组
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        // 循环递归调用$on添加自定义事件
        vm.$on(event[i], fn)
      }
    } else {
      // 向事件中心中该类事件数组中添加事件
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // 做了一层优化 直接标志钩子 代替哈希表的查找
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  Vue.prototype.$once = function (event, fn) {
    // 取出组件实例
    const vm = this
    // 定义一个回调
    function on () {
      // 移除自定义事件
      vm.$off(event, on)
      // 执行一次
      fn.apply(vm, arguments)
    }
    on.fn = fn
    //添加自定义事件
    vm.$on(event, on)
    return vm
  }

  Vue.prototype.$off = function (event, fn) {
    // 取出实例
    const vm = this
    // 如果没有传入参数 则直接将事件中心清空
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // 如果事件是一个数组
    if (Array.isArray(event)) {
      // 循环调用$off 移除事件
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // 拿到此类事件回调的数组
    const cbs = vm._events[event]
    // 回调数组为空不做处理 直接返回
    if (!cbs) {
      return vm
    }
    // 没有传固定的回调函数
    if (!fn) {
      // 把此类事件回调数组清空
      vm._events[event] = null
      return vm
    }
    let cb
    let i = cbs.length
    // 从后向前查找回调 并进行移除
    while (i--) {
      cb = cbs[i]
      // 找到回调函数
      if (cb === fn || cb.fn === fn) {
        // 移除
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  Vue.prototype.$emit = function (event) {
    // 取出实例
    const vm = this
    // 取出事件列表
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      // 遍历执行回调函数
      for (let i = 0, l = cbs.length; i < l; i++) {
        try {
          cbs[i].apply(vm, args)
        } catch (e) {
          console.log(e + '-----' + info)
        }
      }
    }
    return vm
  }
}
