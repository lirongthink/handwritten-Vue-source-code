import { createElement } from "../vdom/create-element";
import VNode, { createEmptyVNode } from "../vdom/vnode";
import { nextTick } from "../utils/next-tick";
import { installRenderHelpers } from "./render-helpers";

export function initRender(vm) {
  
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
