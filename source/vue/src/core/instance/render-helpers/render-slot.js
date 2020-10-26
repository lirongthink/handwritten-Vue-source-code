import { extend } from "../../../shared/util";

export function renderSlot (name, fallback, props, bindObject){
  // 作用域插槽对象
  const scopedSlotFn = this.$scopedSlots[name]
  let nodes
  if (scopedSlotFn) {
    props = props || {}
    if (bindObject) {
      props = extend(extend({}, bindObject), props)
    }
    nodes = scopedSlotFn(props) || fallback
  } else {
    // 从插槽对象中取出相应节点
    nodes = this.$slots[name] || fallback
  }

  const target = props && props.slot
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}
