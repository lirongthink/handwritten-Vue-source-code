import { isPrimitive, isUndef, isDef, isTrue } from "../../../shared/util";
import { createTextVNode } from "../vnode";

//如果数组中还有数组  将它转换成一维数组 及扁平化
export function simpleNormalizeChildren (children) {
  //遍历数组 只要有一个元素为数组 就直接利用concat给全数组拍平并返回
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([],children)
    }
  }
  return children
}

export function normalizeChildren (children) {
  //如果children是原始类型 也就说明是一个文本节点
  //
  return isPrimitive(children) ? [createTextVNode(children)] : Array.isArray(children) ? normalizeArrayChildren(children) : undefined
}

function isTextNode(node) {
  return isDef(node) && isDef(node.text)
}

function normalizeArrayChildren(children, nestedIndex) {
  let res = []
  let i, c, lastIndex, last
  for (let i = 0; i < children.length; i++) {
    c = children[i]
    //无意义的值 不去处理
    if (isUndef(c) || typeof c === 'boolean') continue
    //存储一下最后一个元素的值  为后面优化做准备
    lastIndex = res.length - 1
    last = res[lastIndex]

    //重点  对嵌套的数组进行处理
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)
        //这里做了一个优化 如果c的第一个元素为文本节点 则将他和最后结果的最后一个元素拼接在一起
        //相当于提前将文本节点合并  减少需要处理的节点数量
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + c[0].text)
          c.shift()
        }
        res.push.apply(res,c)
      }
    } else if (isPrimitive(c)) { //对是原始值的元素进行处理
      //如果数组最后一个元素是文本节点  和上面做一样的优化
      if (isTextNode(last)) {
        res[lastIndex] = createTextVNode(last.text + c)
      } else if (c !== '') {
        res.push(createTextVNode(c))
      }
    } else {//是一个VNode节点
      //继续做优化
      if (isTextNode(c) && isTextNode(last)) {
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        // if (isTrue(children._isVList) &&
        //   isDef(c.tag) &&
        //   isUndef(c.key) &&
        //   isDef(nestedIndex)) {
        //   c.key = `__vlist${nestedIndex}_${i}__`
        // }
        res.push(c)
      }
    }
  }
  return res
}
