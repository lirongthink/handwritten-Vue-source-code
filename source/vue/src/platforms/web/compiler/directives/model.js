import { addHandler, getBindingAttr, addProp } from "../../../../compiler/helpers";
import { genAssignmentCode } from "../../../../compiler/directives/model";

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

  if (el.component) { // 对组件v-model的处理
    genComponentModel(el, value, modifiers)
    return false
  } else if (tag === 'select') { // select元素的处理
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
  // multiple 属性表示一个input是否可以有多个值。目前只有火狐支持
  const assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]'
  let code = `var $$selectedVal = ${selectedVal};`
  //
  code = `${code} ${genAssignmentCode(value, assignment)}`
  // 为下拉框添加change事件
  addHandler(el, 'change', code, null, true)
}

function genCheckboxModel(el, value, modifiers) {
  // number修饰符
  const number = modifiers && modifiers.number
  const valueBinding = getBindingAttr(el, 'value') || 'null'
  const trueValueBinding = getBindingAttr(el, 'true-value') || 'true'
  const falseValueBinding = getBindingAttr(el, 'false-value') || 'false'
  // 添加checked属性
  addProp(el, 'checked', 
  `Array.isArray(${value})` +
    `?_i(${value},${valueBinding})>-1` + (
      trueValueBinding === 'true'
        ? `:(${value})`
        : `:_q(${value},${trueValueBinding})`
    )
  )
  // 添加change事件侦听器
  addHandler(el, 'change',
  `var $$a=${value},` +
        '$$el=$event.target,' +
        `$$c=$$el.checked?(${trueValueBinding}):(${falseValueBinding});` +
    'if(Array.isArray($$a)){' +
      `var $$v=${number ? '_n(' + valueBinding + ')' : valueBinding},` +
          '$$i=_i($$a,$$v);' +
      `if($$el.checked){$$i<0&&(${genAssignmentCode(value, '$$a.concat([$$v])')})}` +
      `else{$$i>-1&&(${genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')})}` +
    `}else{${genAssignmentCode(value, '$$c')}}`,
    null, true
  )
}

function genRadioModel(el, value, modifiers){
  // 数字修饰符
  const number = modifiers && modifiers.number
  let valueBinding = getBindingAttr(el, 'value') || 'null'
  valueBinding = number ?  `_n(${valueBinding})` : valueBinding
  // 添加属性
  addProp(el, 'checked', `_q(${value},${valueBinding})`)
  // 添加事件侦听器
  addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true)
}

function genDefaultModel(el, value, modifiers) {
  const type = el.attrsMap.type
  // 获取v-model的修饰符
  const { lazy, number, trim } = modifiers || {}
  // 处理IME问题，即中文输入出现在输入框上方的待候选但还未选择的状态 如 dd'sd's'd大苏打
  const needCompositionGuard = !lazy && type !== 'range'
  // 根据是否懒加载来绑定不同的侦听事件
  const event = lazy ? 'change' : type === 'range' ? RANGE_TOKEN : 'input'
  const valueExpression = '$event.target.value'
  // 判断trim修饰符
  if (trim) {
    valueExpression = `$event.target.value.trim()`
  }
  // 处理number修饰符
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }
  let code = genAssignmentCode(value, valueExpression)
  // 进行中文截断
  if (needCompositionGuard) {
    code = `if($event.target.composing)return;${code}`
  }
  // 这里是双向绑定实现的关键
  // 为输入框添加value属性 并添加侦听事件 在输入框内的数据修改时，为value赋值
  addProp(el, 'value', `(${value})`)
  addHandler(el, event, code, null, true)
  if (trim || number) {
    addHandler(el, 'blur', '$forceUpdate()')
  }
}
