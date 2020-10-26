import { initState } from "./state";
import Watcher from "../observer/watcher";
import { initRender } from "./render";
import { initLifecycle, callHook } from "./lifecycle";
import { initEvents } from "./events";
import { extend } from "../../shared/util";
import { mergeOptions } from "../utils/options";
export function initMixin(Vue) {
  Vue.prototype._init = function(options) {
    const vm = this;//当前实例
    // 判断是否为组件
    if (options && options._isComponent) {
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    // MVVM原理 需要将数据重新初始化
    //拦截数组的方法 和 对象的属性
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    // 此时data methods 等还没初始化 不能拿到
    callHook(vm, 'beforeCreate')
    initState(vm);
    // 此时可以拿到数据 但是组件还没有挂载 不能操作dom
    callHook(vm, 'created')
    //初始化工作
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }

  }
}

export function initInternalComponent(vm, options) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // 子组件的构造函数中传入的options中的
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  // 拿到子组件绑定的自定义事件
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag


  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions(Ctor) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      Ctor.superOptions = superOptions

      const modifiedOptions = resolveModifiedOptions(Ctor)
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions(Ctor) {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for(const key in latest){
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
