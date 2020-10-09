import { isUndef, isDef } from "../../../../shared/util";
import { RANGE_TOKEN, CHECKBOX_RADIO_TOKEN } from "../../compiler/directives/model";
import { isIE, supportsPassive } from "../../../../core/utils/env";
import { updateListeners } from "../../../../core/vdom/helpers/update-listeners";

function normalizeEvents (on) {
  if (isDef(on[RANGE_TOKEN])) {
    // 判断是否为ie
    const event = isIE ? 'change' : 'input'
    on[event] = [].concat(on[RANGE_TOKEN], on[event] || [])
    delete on[RANGE_TOKEN]
  }
  // 做兼容性的处理
  if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
    on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || [])
    delete on[CHECKBOX_RADIO_TOKEN]
  }
}

let target

/**
 * 为事件做一层once的封装
 * @param {string} event 事件名
 * @param {Function} handler 绑定的回调函数
 * @param {boolean} capture 是否捕获
 */
function createOnceHandler(event, handler, capture) {
  const _target = target
  // 返回一个新的封装好的函数
  return function onceHandler() {
    // 执行函数 并返回结果
    const res = handler.apply(null, arguments)
    if (res !== null) {
      // 执行结束后将事件移除
    }
  }
}
/**
 * 添加DOM事件
 * @param {string} name 
 * @param {Function} handler 
 * @param {boolean} capture 
 * @param {boolean} passive 
 */
function add(name, handler, capture, passive) {
  // 利用addEventListener添加dom事件
  target.addEventListener(
    name,
    handler,
    supportsPassive
    ? { capture, passive }
    : capture
  )
}

/**
 * 移除原生DOM事件
 * @param {string} name 
 * @param {Function} handler 
 * @param {boolean} capture 
 * @param {HTMLElement} _target 
 */
function remove(name, handler, capture, _target) {
  // 移除事件
  (_target || target).removeEventListener(
    name,
    handler._wrapper || handler,
    capture
  )
}

function updateDOMListeners(oldVnode, vnode) {
  // 新旧节点都没有绑定事件 直接返回
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  target = vnode.elm
  // 对v-model的处理
  normalizeEvents(on)
  updateListeners(on, oldOn, add, remove, createOnceHandler, vnode.context)
  target = undefined
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
