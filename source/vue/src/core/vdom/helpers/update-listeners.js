import { isUndef, isTrue, remove } from "../../../shared/util";

const normalizeEvent = (name) => {
  // 解析出标识过的标识符
  const passive = name.charAt(0) === '&'
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~'
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
}

export function createFnInvoker(fns) {
  // 后面用户触发的其实是这个事件，这个事件会将用户绑定的事件触发
  function invoker() {
    // 取出绑定的函数
    const fns = invoker.fns
    if (Array.isArray(fns)) {
      const cloned = fns.slice()
      // 循环数组将函数执行
      for (let i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments)
      }
    } else {
      // 直接执行
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns
  return invoker
}

export function updateListeners(on, oldOn, add, remove, createOnceHandler, vm) {
  let name, def, cur, old, event
  for (name in on) {
    // 当前的事件
    def = cur = on[name]
    // 旧的事件
    old = oldOn[name]
    // 拿到解析过的标识符的结果
    event = normalizeEvent(name)

    // 没有旧的事件
    if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        // 创建一个最后要执行的函数
        cur = on[name] = createFnInvoker(cur)
      }
      if (isTrue(event.once)) {
        // 创建一个执行一次就移除的函数
        cur = on[name] = createOnceHandler(event.name, cur, event.capture)
      }
      //调用add
      add(event.name, cur, event.capture, event.passive, event.params)
    } else if (cur !== old) { // 如果是更新 只需要把fns替换掉就行了
      old.fns = cur
      on[name] = old
    }
  }
  for (name in oldOn) {
    // 将事件中没有旧事件移除掉
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
