import { addHandler } from "../../../../compiler/helpers";

export const RANGE_TOKEN = '__r'
export const CHECKBOX_RADIO_TOKEN = '__c'
export default function model (el, dir) {
  // 取出指令的值
  const value = dir.value
  // 取出修饰符
  const modifiers = dir.modifiers
  // 标签
  const tag = el.tag
  // 输入框的类型
  const type = el.attrsMap.type

  // if (el.component) {
  //   genComponentModel(el, value, modifiers)
  //   return false
  // } else 
  if (tag === 'select') { // select元素的处理
    genSelect(el, value, modifiers)
  } else if (tag === 'input' && type === 'checkbox') { // 多选框
    genCheckboxModel(el, value, modifiers)
  } else if (tag === 'input' && type === 'radio') { // 单选框
    genRadioModel(el, value, modifiers)
  } else if (tag === 'input' || tag === 'textarea') { // 默认输入框的处理
    genDefaultModel(el, value, modifiers)
  }
  return true
}

function genSelect(el, value, modifiers) {
  // 取出number修饰符
  const number = modifiers && modifiers.number
  // 拼接代码
  const selectedVal = `Array.prototype.filter` +
    `.call($event.target.options,function(o){return o.selected})` +
    `.map(function(o){var val = "_value" in o ? o._value : o.value;` +
    `return ${number ? '_n(val)' : 'val'}})`
  
    const assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]'
  let code = `var $$selectedVal = ${selectedVal};`
  code = `${code} ${genAssignmentCode(value, assignment)}`
}