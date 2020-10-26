import { createElement } from "../vdom/create-element";
import VNode, { createEmptyVNode } from "../vdom/vnode";
import { nextTick } from "../utils/next-tick";
import { installRenderHelpers } from "./render-helpers";
import { emptyObject } from "../../shared/util";
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from "../vdom/helpers/normalize-scoped-slots";

export function initRender(vm) {
  // 拿出组件的options
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode
  const renderContext = parentVnode && parentVnode.context
  // 解析插槽 并放入$slots 中
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  //编译生成VDOM时使用的方法
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, true)
  //为手写VDOM提供的方法
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, false)
}



export function renderMixin(Vue) {
  
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  }

  Vue.prototype._render = function () {
    //拿到Vue实例
    const vm = this
    const { render, _parentVnode } = vm.$options

    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots
      )
    }

    //将占位符vnode赋值给$vnode
    vm.$vnode = _parentVnode
    // 此vnode为渲染vnode
    let vnode
    try {
      vnode = render.call(vm, vm.$createElement)
    } catch (e) {
      console.log(e)
    }
    //判断  如果不是一个VNode 而且是一个数组  那么说明模板中有多个根节点 这样会报错
    if (!(vnode instanceof VNode) && Array.isArray(vnode)) {
      vnode = createEmptyVNode()
    }
    vnode.parent = _parentVnode
    return vnode
  }
}
