import { emptyObject } from "../shared/util";

export function getAndRemoveAttr(el, name, removeFromMap) {
  let val
  if ((val = el.attrsMap[name]) != null) {
    const list = el.attrsList
    for (let i = 0; i < list.length; i++) {
      if (list[i].name === name) {
        list.splice(i, 1)
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name]
  }
  return val
}

export function pluckModuleFunction (modules, key){
  return modules
    ? modules.map(m => m[key]).filter(_ => _)
    : []
}

export function addDirective(el, name, rawName, value, arg, modifiers, range) {
  (el.directive || (el.directive = [])).push(rangeSetItem({ name, rawName, value, arg, modifiers }, range))
  el.plain = false
}

export function addProp(el, name, value, range) {
  (el.props || (el.props = [])).push(rangeSetItem({ name, value }, range))
  el.plain = false
}

export function addAttr (el, name, value, range) {
  (el.attrs || (el.attrs = [])).push(rangeSetItem({ name, value }, range))
  el.plain = false
}

export function addRawAttr(el, name, value, range) {
  el.attrsMap[name] = value
  el.attrsList.push(rangeSetItem({ name, value }, range))
}

/**
 * 
 * @param {ASTElement} el 
 * @param {string} name 
 * @param {string} value 
 * @param {ASTModifiers} modifiers 
 * @param {boolean} important 新添加的事件是放在前面还是后面
 * @param {Range} range 
 */

export function addHandler(el, name, value, modifiers, important, range) {
  modifiers = modifiers || emptyObject
  // 规范化鼠标中间和右键  现在只有浏览器能适用
  if (name === 'click') {
    if (modifiers.right) {
      name = 'contextmenu'
      delete modifiers.right
    } else if (modifiers.middle) {
      name = 'mouseup'
    }
  }

  // 检测捕获的标识符
  if (modifiers.capture) {
    delete modifiers.capture
    // 标识捕获事件
    name = '!' + name
  }
  //检测once并做处理
  if (modifiers.once) {
    delete modifiers.once
    // 标识once
    name = '~' + name
  }
  // 检测passive并做处理
  if (modifiers.passive) {
    delete modifiers.passive
    // 标识冒泡
    name = '&' + name
  }
  let events
  // 判断是否有native修饰符
  if (modifiers.native) { // 原生DOM事件
    delete modifiers.native
    events = el.nativeEvents || (el.nativeEvents = {})
  } else { // 自定义事件
    events = el.events || (el.events = {})
  }

  // 创建一个对象
  const newHandler = rangeSetItem({ value:value.trim() }, range)
  // 如果有修饰符 就把修饰符添加
  if (modifiers !== emptyObject) {
    newHandler.modifiers = modifiers
  }

  const handlers = events[name]
  // 同一个事件可以绑定多个回调函数
  if (Array.isArray(handlers)) { // 已经存在了
    important ? handlers.unshift(newHandler) : handlers.push(handlers)
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
  } else {
    events[name] = newHandler
  }

  el.plain = false
}

// 解析v-bind指令
export function getBindingAttr (el, name, getStatic) {
  //解析并移除指令
  const dynamicValue = getAndRemoveAttr(el, ':' + name) || getAndRemoveAttr(el, 'v-bind:' + name)
  if (dynamicValue != null) {
    return parseFilters(dynamicValue)
  } else if (getStatic !== false) { //检测是否为静态标签
    const staticValue = getAndRemoveAttr(el, name)
    if (staticValue != null) {
      return JSON.stringify(staticValue)
    }
  }
}

function rangeSetItem(item, range) {
  if (range) {
    if (range.start != null) {
      item.start = range.start
    }
    if (range.end != null) {
      item.end = range.end
    }
  }
  return item
}
