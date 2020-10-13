import VNode from "../vnode";
import { remove, isUndef, isTrue } from "../../../shared/util";
import { createFnInvoker } from "./update-listeners";

export function mergeVNodeHook (def, hookKey, hook) {
  // 判断是否为虚拟节点
  if (def instanceof VNode) {
    // 如果没有hook  给赋一个初值
    def = def.data.hook || (def.data.hook = {})
  }
  let invoker
  // 记录旧的钩子
  const oldHook = def[hookKey]
  // 创建一个函数  执行钩子
  function wrappedHook() {
    hook.apply(this, arguments)
    // 执行一次后 移除函数
    remove(invoker.fns, wrappedHook)
  }
  // 如果没有旧的钩子函数  就创建钩子函数
  if (isUndef(oldHook)) {
    // 创建一个新的函数数组 并将新建的函授放进去
    invoker = createFnInvoker([wrappedHook])
  } else {
    if (isUndef(oldHook.fns) && isTrue(oldHook.merged)) {
      // 将函数添加进去
      invoker = oldHook
      invoker.fns.push(wrappedHook)
    } else {
      invoker = createFnInvoker([oldHook, wrappedHook])
    }
  }

  invoker.merged = true
  def[hookKey] = invoker
}
