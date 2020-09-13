import { createEmptyVNode } from "../vdom/vnode";
import Watcher from "../observer/watcher";

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
  }
}

export function initLifecycle(vm) {
  const options = vm.$options

  let parent = options.parent
  // 使父子关系通过$parent和$children建立
  if (parent && !options.abstract) {
    while (parent.$parent.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }
  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}
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
  })

  // 根节点没有$vnode  也就是父节点  所以根节点这个时候调用mounted
  if (vm.$vnode == null) {
    // 标识它已挂载
    vm._isMounted = true
    // 调用mounted钩子
    callHook(vm, 'mounted')
  }
  return vm
}

export function callHook(vm, hook) {
  // 拿到选项中已经合并好的钩子函数
  // const handlers = vm.$options[hook]
  // // 循环并执行钩子函数 通过call传入vm 使钩子函数中的this可以指向实例
  // for (let i = 0; i < handlers.length; i++) {
  //   try {
  //     handlers[i].call(vm)
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }
}
