export function isObject(data) {
  return typeof data === 'object' && data !== null;
}
export function proxy(vm,source,key) { //代理数据  vm.msg = vm._data.msg
  Object.defineProperty(vm,key,{
    get(){
      return vm[source][key]
    },
    set(newValue){
      if (vm[source][key] === newValue) return
      vm[source][key] = newValue
    }
  })
}
export function def(data,key,val) {
  Object.defineProperty(data,key,{
    enumerable:false,//不可枚举
    configurable:false,//不可配置
    value:val
  })
}
export function query(el) {
  return typeof el === 'string' ? document.querySelector(el) : el
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
    return getValue(vm,args[1])
  })
}
export function getValue(vm,expr) {
  let keys = expr.split('.')
  console.log(keys)
  return keys.reduce((memo,current) =>{
    memo = memo[current]
    return memo
  },vm)
}
