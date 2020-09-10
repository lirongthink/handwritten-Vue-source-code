export default class VNode {
  constructor(tag,data,children,text,elm){
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.key = data && data.key
    this.ns = undefined
    this.componentInstance = undefined
    this.parent = undefined
    this.isStatic = false
    this.isComment = false
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
