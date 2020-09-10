let callbacks = []
let pending = false


function flushCallbacks() {
  callbacks.forEach(cb => cb())
}

//要异步刷新这个callbacks，获取一个异步的方法
  //先检测浏览器是否支持promise  不支持 就采用  mutationObsever  再不支持就采用 setImmediate  如果都不支持采用setTimeout
let timerFunc

//浏览器是否支持Promise
if (typeof Promise !== 'undefined') {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
  }
} else if (typeof MutationObserver !== 'undefined') { //浏览器是否支持MutationObserver //H5中的方法
  let counter = 1
  let observe = new MutationObserver(flushCallbacks)
  let textNode = document.createTextNode(String(counter))
  observe.observe(textNode,{ characterData : true}) //观察文本节点改变时调用方法
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
} else if (typeof setImmediate !== 'undefined') {// 浏览器是否支持setImmediate
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {// 都不支持用setTimeout
  timerFunc = () => {
    setTimeout(flushCallbacks,0)
  }
}

export function nextTick(cb, ctx) { //cb就是flushQueue 或者用户通过Vue.nextTick添加的回调函数
  let _resolve
  callbacks.push(() => {
    if (cb) {
      cb.call(ctx)
    } else if (_resolve) {
      _resolve(ctx)
    }
  });
  
  if (!pending) {
    pending = true
    timerFunc()
  }
  // .then的调用方式
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
  
  
}
