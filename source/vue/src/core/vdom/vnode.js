export default class VNode {
  constructor(tag,data,children,text,elm,context,componentOptions,asyncFactory){
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }
}

//创建文本节点
export function createTextVNode(val) {
  return new VNode(undefined,undefined,undefined,String(val))
}

//创建空节点
export function createEmptyVNode(text = '') {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}
