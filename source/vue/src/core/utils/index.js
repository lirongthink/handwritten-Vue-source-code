export function isObject(data) {
  return typeof data === 'object' && data !== null;
}

export function def(obj, key, val, enumerable) {
  Object.defineProperty(obj,key,{
    enumerable:!!enumerable,
    configurable:true,
    writable: true,
    value:val
  })
}
export function query(el) {
  //根据传入的id来获取到相应的dom
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if(!selected){ //如果没有获取到 则新建一个dom
      return document.createElement('div')
    }
    return selected
  } else {
    return typeof el === 'string' ? document.querySelector(el) : el
  }
}
export function compiler(node,vm) {
  let childNodes = node.childNodes;
  //将类数组转化成数组
  [...childNodes].forEach(child => { //一种时元素 一种是文本
    if (child.nodeType == 1) { // 1元素 3表示文本
      compiler(child.vm)
    } else if (child.nodeType == 3){
      compilerText(child,vm)
    }
  });
}
//?: 匹配不捕获
function compilerText(node,vm){ //编辑文本 替换{{}}
  const regexp = /\{\{((?:.|\r?\n)+?)\}\}/g
  if (!node.expr) {
    node.expr = node.textContent //给节点增加了一个自定义属性 为了方便后续的更新操作
  }
  node.textContent = node.expr.replace(regexp,function(...args) {
    return parsePath(vm,args[1])
  })
}
export function parsePath(vm,expr) {
  let keys = expr.split('.')
  return keys.reduce((obj,current) =>{
    obj = obj[current]
    return obj
  },vm)
}
