import { isAsyncPlaceholder } from "../../../../core/vdom/helpers/is-async-placeholder";

export const transitionProps = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,
  duration: [Number, String, Object]
}

const isNotTextNode = c =>c.tag || isAsyncPlaceholder(c)

function hasParentTransition (vnode) {
  // 循环查找 如果已经有父节点是过渡节点  则直接忽略
  while ((vnode = vnode.parent)) {
    if (vnode.data.transition) {
      return true
    }
  }
}

function getRealChild (vnode) {
  const compOptions = vnode && vnode.compOptions
  //  如果子节点是个抽象组件 则重新获取子节点
  if (compOptions && compOptions.Ctor.options.abstract) {
    return getRealChild(getFirstComponentChild(compOptions.children))
  } else { // 直接返回
    return vnode
  }
}

export function extractTransitionData (comp) {
  const data = {}
  const options = comp.$options
  // 循环将transition中定义的 属性 存入data
  for (const key in options.propsData) {
    data[key] = comp[key]
  }
  return data
}

export default {
  name:'transition',
  props: transitionProps,
  abstract: true,

  render (h) {
    // 取出默认插槽
    let children = this.$slots.default
    // 如果没有 说明transition没有包裹东西
    if (!children) {
      return
    }

    // 过滤文本节点 因为可能是空格
    children = children.filter(isNotTextNode)
    // 没有子节点 直接返回
    if (!children.length) {
      return
    }

    const mode = this.mode
    // 拿到真实节点
    const rawChild = children[0]
    if (hasParentTransition(this.$vnode)) {
      return rawChild
    }
    // 获取到真实子节点
    const child = getRealChild(rawChild)
    if (!child) {
      return rawChild
    }
    // 拼接出id
    const id = `__transition-${this._uid}-`
    child.key = child.key == null
      ? child.isComment
        ? id + 'comment'
        : id + child.tag
      : isPrimitive(child.key)
        ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
        : child.key

    const data = (child.data || (child.data = {})).transition = extractTransitionData(this)
    return rawChild
  }
}
