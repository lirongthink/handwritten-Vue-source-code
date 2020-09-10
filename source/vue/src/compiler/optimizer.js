import { isBuiltInTag } from "../shared/util";

let isStaticKey
let isPlatformReservedTag

// 找出永远不会改变的静态节点  在diff算法的时候跳过
export function optimize(root, options) {
  // 没有根节点 直接返回
  if (!root) return
  isStaticKey = genStaticKeys(options.staticKyes || '')
  isPlatformReservedTag = options.isReservedTag || false
  //对节点进行静态标记
  markStatic(root)
  //标记节点是否是一个根静态节点
  markStaticRoots(root, false)
}

function genStaticKeys(keys) {
  const str = 'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap,has$Slot' + (keys ? ',' + keys : '')
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return val => map[val]
}

function markStatic(node) {
  node.static = isStatic(node)
  if (node.type === 1) {
    // 不要把插槽内容和行内模板设置成静态
    if (!isPlatformReservedTag(node.tag) && !node.component && node.tag !== 'slot' && node.attrsMap['inline-template'] == null) {
      return
    }
    //循环子节点去动态标记
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      //如果有一个子节点不为静态节点 那么就将此节点设置为非静态节点
      if (!child.static) {
        node.static = false
      }
    }
    if (node.ifConditions) {
      for (let i = 0, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

function markStaticRoots(node, isInFor) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }
    // 当前节点是静态节点 节点有子节点且子节点不止一个 
    // 只有一个子节点且子节点为文本节点的情况  对它标记的成本是大于收益的
    if (node.static && node.children.length && !(node.children.length === 1 && node.children[0].type === 3)) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    //循环去标记子节点
    if (node.children) {
      for (let i = 0,l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    if (node.ifConditions) {
      for (let i = 0,l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

function isStatic (node) {
  if (node.type === 2) { 
    return false
  }
  if (node.type === 3) { // 文本节点  标记为静态
    return true
  }
  //判断如果含有v-pre属性
  return !!(node.pre || (
    !node.hasBindings && // 没有绑定动态属性
    !node.if && !node.for && // 不是v-if 或者v-for 或者v-else
    !isBuiltInTag(node.tag) && //不是内置属性
    isPlatformReservedTag(node.tag) && //当前平台保留的一些标签 如 <div> <p>
    !isDirectChildOfTemplateFor(node) && //不是v-for指令下的直接节点
    Object.keys(node).every(isStaticKey) // 它的每个属性也都是动态的
  ))
}

function isDirectChildOfTemplateFor(node) {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
}
