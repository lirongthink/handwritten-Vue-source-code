import { isDef, isTrue, isPrimitive, isUndef, makeMap } from "../../shared/util";
import VNode from "./vnode"; 

export const emptyNode = new VNode('', {}, [])

// 钩子函数
const hooks = ['create', 'activate', 'update', 'remove', 'destroy']


function sameVnode(a, b) {
  return ( // 首先key要相同 其次再去比较tag标签名、 isComment是否为注释节点、 data是否已定义 、如果是输入框 类型是否相同
    a.key === b.key && (
      a.tag === b.tag &&
      a.isComment === b.isComment &&
      isDef(a.data) === isDef(b.data) &&
      sameInputType(a, b)
    )
  )
}

var isTextInputType = makeMap('text,number,password,search,email,tel,url');

function sameInputType (a, b) {
  if (a.tag !== 'input') return true
  let i
  const typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type
  const typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  let i, key
  const map = {}
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key
    if (isDef(key)) map[key] = i
  }
  return map
}

export function createPatchFunction(backend) {
  let i, j
  const cbs = {}
  const { modules, nodeOps } = backend
  // 循环添加钩子函数
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = []
    // 循环modules中的函数并添加
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]])
      }
    }
  }
  
  function createChildren(vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      for (let i = 0;i < children.length;i++) {
        createElm(children[i],insertedVnodeQueue, vnode.elm)
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

  function addVnodes(parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx < endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm)
    }
  }

  function removeNode (el) {
    // 获取它的父节点
    const parent = nodeOps.parentNode(el)
    if (isDef(parent)) {
      nodeOps.removeChild(parent.el)
    }
  }

  function invokeDestroyHook(vnode) {
    let i, j
    const data = vnode.data
    // 执行destroy 钩子
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode)
    }
    //如果有子vnode 递归调用
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.leng; ++j) {
        invokeDestroyHook(vnode.children[j])
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx]
      if (isDef(ch)) {
        if (!isDef(ch.tag)) {
          // removeAndInvokeRemoveHook(ch)
          //调用destroy钩子函数
        //   invokeDestroyHook(ch)
        // } else {
          removeNode(ch.elm)
        }
      }
    }
  }

  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    // 循环调用create钩子函数
    for (let i = 0; i < cbs.create.length; ++i) {
      cbs.create[i](emptyNode, vnode)
    }
    
    let i = vnode.data.hook
    if (isDef(i)) {
      if (isDef(i.create)) i.create(emptyNode, vnode)
      if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
    }
  }

  function invokeInsertHook (vnode, queue) {
    //循环遍历  调用组件的insert
    for (let i = 0; i < queue.length; i++) {
      queue[i].data.hook.insert(queue[i])
    }
  }

  function createComponent(vnode,insertedVnodeQueue, parentElm, refElm) {
    let i = vnode.data
    if (isDef(i)) {
      // 判断是否有钩子函数  而且是否有init 如果有就执行init
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false)
      }
    }

    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue)
      insert(parentElm, vnode.elm, refElm)

      return true
    }
  }

  function initComponent(vnode, insertedVnodeQueue) {
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
    } else {
      insertedVnodeQueue.push(vnode)
    }
  }

  function isPatchable(vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode
    }
    return isDef(vnode.tag)
  }  

  function createElm(vnode, insertedVnodeQueue, parentElm, refElm) {

    // 如果是组件
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag

    // 标签是有意义的
    if (isDef(tag)) {
      vnode.elm = vnode.ns ? nodeOps.createElementNs(vnode.ns, tag) : nodeOps.createElement(tag, vnode)
      //先创建他的子节点
      createChildren(vnode, children, insertedVnodeQueue)
      if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue)
      }
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

  function findIdxInOld(node, oldCh, start, end) {
    for (let i = start; i < end; i++) {
      const c = oldCh[i]
      if (isDef(c) && sameVnode(node, c)) return i
    }    
  }

  function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
    //如果新旧节点相同 则不用去处理 直接返回
    if (oldVnode === vnode) {
      return
    }
    // 拿到旧节点的真实DOM
    const elm = vnode.elm = oldVnode.elm
    //如果都为静态节点  且key值一样
    if (isTrue(vnode.isStatic) && isTrue(oldVnode.isStatic) && vnode.key === oldVnode.key) {
      //将组件实例从老节点拿过来
      vnode.componentInstance = oldVnode.componentInstance
      return
    }
    //判断是否有prepatch钩子函数  如果有则执行
    let i
    const data = vnode.data
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {//这里相当于深层次查找 一层一层的判断
      i(oldVnode, vnode)
    }

    const oldCh = oldVnode.children
    const ch = vnode.children

    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
      if (isDef(i = data.hook) && isDef(i = i.update)) i(oldVnode, vnode)
    }
    // 非文本节点
    if (isUndef(vnode.text)) {
      //新旧节点都有子节点
      if (isDef(oldCh) && isDef(ch)) {
        // 进入子节点的比对
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue)
      } else if (isDef(ch)) { // 如果只有新节点有子节点
        // 如果旧节点有文本 则需要先清空
        if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
        //将新的子节点创建并添加到新节点上
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
      } else if (isDef(oldCh)) { // 如果只有旧节点有子节点
        //直接全部移除掉就行了
        removeVnodes(elm, oldCh, 0, oldCh.length - 1)
      } else if (isDef(oldVnode.text)) { // 只有老节点有文本节点  则清空
        nodeOps.setTextContent(elm, vnode.text)
      }
    } else if (oldVnode.text !== vnode.text) { //文本节点的处理  如果文本不同直接替换文本
      nodeOps.setTextContent(elm, vnode.text)
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) i(oldVnode, vnode)
    }
  }


  function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
    let oldStartIdx = 0
    let newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx, idxInOld, vnodeToMove, refElm

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) { // 当oldStartVnode或oldEndVnode不存在的时候，oldStartIdx与oldEndIdx继续向中间靠拢，并更新对应的oldStartVnode与oldEndVnode的指向
        oldStartVnode = oldCh[++oldStartIdx]
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx]
      } else if (sameVnode(oldStartVnode, newStartVnode)) { //老的头节点和新的头节点对比
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
        oldStartVnode = oldCh[++oldStartIdx]
        newStartVnode = newCh[++newStartIdx]
      } else if (sameVnode(oldEndVnode, newEndVnode)) { // 老的尾节点和新的尾节点对比
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
        oldEndVnode = oldCh[--oldEndIdx]
        newEndVnode = newCh[--newEndIdx]
      } else if (sameVnode(oldStartVnode, newEndVnode)) {// 老的头节点和新的尾节点对比
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
        nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
        oldStartVnode = oldCh[++oldStartIdx]
        newEndVnode = newCh[--newEndIdx]
      } else if (sameVnode(oldEndVnode, newStartVnode)) {// 老的尾节点的新的头节点对比
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
        oldEndVnode = oldCh[--oldEndIdx]
        newStartVnode = newCh[++newStartIdx]
      } else { // 如果以上都没有相同的 进入下面逻辑 进行key的对比
        // 创建一个老节点key和位置一一对应的map表
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
        // 如果定义了新结点的key 则去旧节点的map表里取  否则循环旧节点去找和新节点相同的节点的位置
        idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
        if (isUndef(idxInOld)) { // 旧节点中没有这个新节点  则直接创建一个
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm)
        } else {
          // 取出旧节点中刚刚找到的位置上的节点
          vnodeToMove = oldCh[idxInOld]
          if (sameVnode(vnodeToMove, newStartVnode)) {
            // 如果相同直接调用patch
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue)
            // 将旧节点中的节点设置为undefined  防止重复匹配
            oldCh[idxInOld] = undefined
            // 将这个节点插到当前旧节点指针位置的前面
            nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
          } else { // 如果key相同的找到了但是不是相同元素 则创建一个新的元素
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm)
          }
        }
        // 新节点指针向后移一位
        newStartVnode = newCh[++newStartIdx]
      }
    }
    // 把剩下的节点做一些处理
    if (oldStartIdx > oldEndIdx) { // 此时新结点可能还有节点没有处理完
      // 取到新结点最后的节点
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
      // 把剩下的都给一次添加进去
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
    } else if (newStartIdx > newEndIdx) { // 此时旧节点中可能还有未处理的节点
      // 把旧节点中剩下的都移除
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }

  //将真实DOM转换成VNode
  function emptyNodeAt(elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  return function patch(oldVnode, vnode) {
    const insertedVnodeQueue = []
    if (isUndef(oldVnode)) {
      createElm(vnode, insertedVnodeQueue)
    } else {
      // 判断旧的节点是否为一个元素
      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) { // 这里更新时不为元素 而是vnode 而且需要是相同的vnode
        //这里就进入了节点比较的逻辑  也就是DOM diff
        patchVnode(oldVnode, vnode, insertedVnodeQueue)
      } else {
        //将真实DOM转化为VNode
        if (isRealElement) {
          oldVnode = emptyNodeAt(oldVnode)
        }

        //获取父节点
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)

        //创建真实DOM并将VNode挂载上去
        createElm(vnode, insertedVnodeQueue, parentElm)
        // 移除旧的节点
        if (isDef(parentElm)) {
          removeVnodes(parentElm, [oldVnode], 0, 0)
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue)
    return vnode.elm
  }
}
