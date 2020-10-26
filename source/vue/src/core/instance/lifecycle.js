import { createEmptyVNode } from "../vdom/vnode";
import Watcher from "../observer/watcher";
import { emptyObject } from "../../shared/util";
import { pushTarget, popTarget } from "../observer/dep";
import { resolveSlots } from "./render-helpers/resolve-slots";

// 此变量用来记录当前的实例  以便于与其子组件形成一定的关系
export let activeInstance = null

export function setActiveInstance(vm) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}


export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    // 这里是一个回溯的过程
    // 将当前激活对象设置为 其父组件(暂存)  并将当前实例设置为激活对象
    const restoreActiveInstance = setActiveInstance(vm)
    // 渲染vnode
    vm._vnode = vnode
    // 判断当前实例是否为根实例
    if (!prevVnode) {
      //第一次创建时 传入的第一个参数为真实dom
      vm.$el = vm.__patch__(vm.$el,vnode)
    } else { // 此时为子组件渲染
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    // 子组件处理完成后  将暂存的父组件再次恢复为当前激活对象
    restoreActiveInstance()

    
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }

    // 强制页面重新渲染的API
    Vue.prototype.$forceUpdate = function () {
      const vm = this
      if (vm._watcher) {
        // 调用当前实例watcher的update方法
        vm._watcher.update()
      }
    }
    // 页面销毁调用
    Vue.prototype.$destroy = function () {
      const vm = this
      // 组件已经销毁 直接返回
      if (vm._isBeingDestroyed) {
        return
      }
      // 调用beforeDestroy钩子函数
      callHook(vm, 'beforeDestroy')
      vm._isBeingDestroyed = true

      const parent = vm.$parent
      // 如果父组件存在 且还未销毁 从父组件中移除自己
      if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
        remove(parent.$children, vm)
      }
      // 如果有watcher  调用teardown()取消多有dep中的存储
      if (vm._watcher) {
        vm._watcher.teardown()
      }
      // 如果有多个watcher 循环清除
      let i = vm._watchers.length
      while (i--) {
        vm._watchers[i].teardown()
      }
      // 移除__ob__引用
      if (vm._data_.__ob__) {
        vm._data_.__ob__.vmCount--
      }
      // 标志一下  已销毁
      vm._isDestroyed = true
      // 在渲染树中销毁节点
      vm.__patch__(vm._vnode, null)
      // 调用destroyed钩子
      callHook(vm, 'destroyed')
      // 移除事件
      vm.$off()
      // 移除__vue__引用
      if (vm.$el) {
        vm.$el.__vue__ = null
      }
      // 解开循环引用
      if (vm.$vnode) {
        vm.$vnode.parent = null
      }
    }
  }
}

function isInInactiveTree (vm) {
  // 循环判断父节点是否active
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}

export function activateChildComponent (vm, direct) {
  // 保证每个组件都只调用一次activated钩子
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  // 如果当前组件没有active 则循环
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    // 调用activated钩子
    callHook(vm, 'activated')
  }
}

export function deactivateChildComponent (vm, direct) {
  // 保证每个组件都只调用一次deactivated钩子
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}

export function initLifecycle(vm) {
  const options = vm.$options

  let parent = options.parent
  // 使父子关系通过$parent和$children建立组件链
  if (parent && !options.abstract) {// 抽象组件（如keep-alive）不会参与建立
    while (parent.$parent.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }
  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function mountComponent(vm, el) {
  vm.$el = el
  //如果用户没有填写render函数  而且也没有成功转换
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
  }

  // 组件在挂载之前会先执行beforeMount
  callHook(vm, 'beforeMount')
  //源码中这里还做了埋点
  let updateComponent = () =>{
    //调用渲染函数  获取VDOM
    vm._update(vm._render())
  }

  //创建渲染Watcher
  new Watcher(vm, updateComponent, () =>{}, {
    before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true)

  // 根节点没有$vnode  也就是父节点  所以根节点这个时候调用mounted
  if (vm.$vnode == null) {
    // 标识它已挂载
    vm._isMounted = true
    // 调用mounted钩子
    callHook(vm, 'mounted')
  }
  return vm
}
export function updateChildComponent(vm, propsData, listeners, parentVnode, renderChildren) {
  // 是否有插槽
  const hasChildren = !!(
    renderChildren || // 有新的静态插槽
    vm.$options._renderChildren || // 有旧的静态插槽
    parentVnode.data.scopedSlots || // 有新的作用域插槽
    vm.$scopedSlots !== emptyObject // 有旧的作用域插槽
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode

  if (hasChildren) {
    // 如果有插槽则重新解析插槽代码
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    // 强制重新渲染页面
    vm.$forceUpdate()
  }
}
export function callHook(vm, hook) {
  pushTarget()
  // 拿到选项中已经合并好的钩子函数
  const handlers = vm.$options[hook] || []
  // 循环并执行钩子函数 通过call传入vm 使钩子函数中的this可以指向实例
  for (let i = 0; i < handlers.length; i++) {
    try {
      handlers[i].call(vm)
    } catch (e) {
      console.log(e)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget()
}
