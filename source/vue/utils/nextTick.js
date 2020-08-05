let callbacks = []
function flushCallbacks() {
  callbacks.forEach(cb => cb())
}
export function nextTick(cb) { //cb就是flushQueue 或者用户通过Vue.nextTick添加的回调函数
  callbacks.push(cb);

  //要异步刷新这个callbacks，获取一个异步的方法
  //先检测浏览器是否支持promise  不支持 就采用  mutationObsever  再不支持就采用 setImmediate  如果都不支持采用setTimeout
  let timerFunc = () =>{
    flushCallbacks()
  }
  //浏览器是否支持Promise
  if (Promise) {
    return Promise.resolve().then(timerFunc)
  }
  //浏览器是否支持MutationObserver
  if (MutationObserver) { //H5中的方法
    let observe = new MutationObserver(timerFunc)
    let textNode = document.createTextNode(1)
    observe.observe(textNode,{ characterData : true}) //观察文本节点改变时调用方法
    textNode.textContent(2)
    return
  }
  // 浏览器是否支持setImmediate
  if (setImmediate) {
    return setImmediate(timerFunc)
  }
  // 都不支持用setTimeout
  setTimeout(timerFunc,0)
}
