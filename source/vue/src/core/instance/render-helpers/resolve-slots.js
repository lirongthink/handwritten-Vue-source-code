
export function resolveSlots (children, context) {
  // 没有子节点 直接返回空对象
  if (!children || !children.length) {
    return {}
  }
  const slots = {}
  // 遍历子节点
  for (let i = 0, l = children.length; i < l; i++) {
    // 拿出当前子节点
    const child = children[i]
    const data = child.data
    //如果有slot属性  就删掉
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot
    }
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) { // 具名插槽 按不同的key进行返回
      const name = data.slot
      const slot = (slots[name] || (slots[name] = []))
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || [])
      } else {
        slot.push(child)
      }
    } else { // 否则都放入default中
      (slots.default || (slots.default = [])).push(child)
    }
  }
  // 对空节点做一些处理
  for (const name in slots) {
    if (slots[name].every(isWhitespace)) {
      delete slots[name]
    }
  }
  return slots
}

function isWhitespace (node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

export function resolveScopedSlots (fns, res) {
  res = res || {}
  for (let i = 0; i < fns.length; i++) {
    const slot = fns[i]
    // 如果是数组 递归调用
    if (Array.isArray(slot)) {
      resolveScopedSlots(slot, res)
    } else {
      // 将插槽名作为key  函数串作为value
      res[slot.key] = slot.fn
    }
  }
  return res
}
