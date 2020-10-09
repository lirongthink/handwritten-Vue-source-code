import VNode from "../vnode";
import { remove, isUndef, isTrue } from "../../../shared/util";

export function mergeVNodeHook (def, hookKey, hook) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {})
  }
  let invoker
  const oldHook = def[hookKey]

  function wrappedHook() {
    hook.apply(this, arguments)

    remove(invoker.fns, wrappedHook)
  }
  // 如果没有旧的钩子函数  就创建钩子函数
  if (isUndef(oldHook)) {
    invoker = createFnInvoker([wrappedHook])
  } else {
    if (isUndef(oldHook.fns) && isTrue(oldHook.merged)) {
      invoker = oldHook
      invoker.fns.push(wrappedHook)
    } else {
      invoker = createFnInvoker([oldHook, wrappedHook])
    }
  }

  invoker.merged = true
  def[hookKey] = invoker
}
