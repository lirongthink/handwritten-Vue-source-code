import VNode, { createEmptyVNode } from "./vnode";
import { normalizeChildren, simpleNormalizeChildren } from "./helpers/normalize-children";
import { isDef } from "../../shared/util";
import { createComponent } from "./create-component";

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

//此函数为先对传入的参数做一些处理
export function createElement (context,tag,data,children,normalizationType){
  //第三个参数可以不传  判断传的第三个参数是否是children
  if (Array.isArray(data) || data === null || data === undefined) {
    normalizationType = children
    children = data
    data = undefined
  }
  return _createElement(context,tag,data,children,normalizationType)
}

export function _createElement(context,tag,data,children,normalizationType) {

  //这里还会进行响应式判断 不允许传入的data是响应式的


  // if (data !== null && data !== undefined && data.is !== null && data.is !== undefined) {
  //   tag = data.is
  // }

  //没有标签 返回一个空的VNode
  if (!tag) {
    return createEmptyVNode()
  }

  // if (Array.isArray(children) && typeof children[0] === 'function') {
  //   data = data || {}
  // }
  //重要的处理  本质就是把children 是多层数组的情况给扁平化
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  //创建VNode
  let vnode, ns
  if (typeof tag === 'string') {
    let Ctor
    vnode = new VNode(tag, data, children, undefined, undefined, context)
  } else { //对组件的处理
    vnode = createComponent(tag, data, context, children)
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    return vnode
  } else {
    return createEmptyVNode()
  }
}
