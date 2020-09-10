import { isDef, isTrue, isPrimitive } from "../../shared/util";
import VNode from "./vnode"; 

export function createPatchFunction(backend) {
  const { nodeOps } = backend
  
  function createChildren(vnode, children) {
    if (Array.isArray(children)) {
      for (let i = 0;i < children.length;i++) {
        createElm(children[i], vnode.elm)
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
    }
  }

  function insert(parent, elm, ref) {
    if (isDef(parent)) {
      if (isDef(ref)) {
        if (nodeOps.parentNode(ref) === parent) {
          nodeOps.insertBefore(parent, elm, ref)
        }
      } else {
        nodeOps.appendChild(parent, elm)
      }
    }
  }

  function createElm(vnode,parentElm) {

    // 如果是组件
    if (createComponent(vnode, parentElm, refElm)) {
      return
    }

    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag

    // 标签是有意义的
    if (isDef(tag)) {
      vnode.elm = vnode.ns ? nodeOps.createElementNs(vnode.ns, tag) : nodeOps.createElement(tag, vnode)
      //先创建他的子节点
      createChildren(vnode, children)
      // 把当前节点插入父节点中
      insert(parentElm, vnode.elm, refElm)
    } else if (isTrue(vnode.isComment)){ // 如果是注释节点
      vnode.elm = nodeOps.createComment(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    } else { // 文本节点
      vnode.elm = nodeOps.createTextNode(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    }
  }

  //将真实DOM转换成VNode
  function emptyNodeAt(elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  return function patch(oldVnode, vnode) {
    const isRealElement = isDef(oldVnode.nodeType)
    //将真实DOM转化为VNode
    if (isRealElement) {
      oldVnode = emptyNodeAt(oldVnode)
    }
    //获取父节点
    const oldElm = oldVnode.elm
    const parentElm = nodeOps.parentNode(oldElm)

    //创建真实DOM并将VNode挂载上去
    createElm(vnode,parentElm)

    // 移除旧的节点
    if (isDef(parentElm)) {
      removeVnodes(parentElm, [oldVnode], 0, 0)
    }
  }
}
