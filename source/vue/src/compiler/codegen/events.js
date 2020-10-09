const fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/
const fnInvokeRE = /\([^)]*?\);*$/
const simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

// 按键事件
const keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
}

const genGuard = condition => `if(${condition})return null;`

const modifierCode = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.altKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`)
}

const keyNames = {
  // #7880: IE11 and Edge use `Esc` for Escape key name.
  esc: ['Esc', 'Escape'],
  tab: 'Tab',
  enter: 'Enter',
  // #9112: IE11 uses `Spacebar` for Space key name.
  space: [' ', 'Spacebar'],
  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  // #9112: IE11 uses `Del` for Delete key name.
  'delete': ['Backspace', 'Delete', 'Del']
}
/**
 * 解析事件生成代码
 * @param {ASTElementHandlers} events AST节点的事件列表
 * @param {boolean} isNative 是否为原生事件
 */
// 对代码进行拼接
export function genHandlers (events, isNative) {
  // 根据是否为原生事件设置不同对象
  let res = isNative ? 'nativeOn:{' : 'on:{'
  // 遍历事件列表 解析成代码并拼接在一起
  for (const name in events) {
    res += `"${name}":${genHandler(name, events[name])},`
  }
  // 将最后的,截取掉 并补上大括号
  return res.slice(0, -1) + '}'
} 
/**
 * // 解析事件返回代码
 * @param {string} name 事件名
 * @param {ASTElementHandler} handler 事件回调
 */
function genHandler(name, handler) {
  // 如果没有绑定事件 直接返回空函数
  if (!handler) {
    return 'function(){}'
  }
  // 递归解析
  if (Array.isArray(handler)) {
    return `[${handler.map(handler => genHandler(name,handler)).join(',')}]`
  }
  const isMethodPath = simplePathRE.test(handler.value)
  const isFunctionExpression = fnExpRE.test(handler.value)
  const isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''))
  // 如果事件没有修饰符
  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value
    }
    // 将外面包裹一层函数 并传入$event
    return `function($event){${
      isFunctionInvocation ? `return ${handler.value}` : handler.value
    }}`
  } else {
    let code = ''
    let genModifierCode = ''
    const keys = []
    // 遍历修饰符
    for (const key in handler.modifiers) {
      if (modifierCode[key]) {
        // 生成相应修饰符的代码
        genModifierCode += modifierCode[key]
        // 鼠标左右键事件
        if (keyCodes[key]) {
          keys.push(key)
        }
      } else if (key === 'exact') {
        const modifiers = handler.modifiers
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
          .filter(keyModifier => !modifiers[keyModifier])
          .map(keyModifier => `$event.${keyModifier}Key`)
          .join('||')
        )
      } else {
        keys.push(key)
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys)
    }
    // 将解析生成的修饰符代码进行拼接
    if (genModifierCode) {
      code += genModifierCode
    }
    // 最后将函数执行并传入$event
    const handlerCode = isMethodPath
    ? `return ${handler.value}($event)`
    : isFunctionExpression
      ? `return (${handler.value})($event)`
      : isFunctionInvocation
        ? `return ${handler.value}`
        : handler.value
    // 将解析的代码结合 先执行修饰符的代码 再执行回调
    return `function($event){${code}${handlerCode}}`
  }
}

function genKeyFilter(keys) {
  return `if(!('button' in $event)&&${keys.map(genFilterCode).join('&&')})return null;`
}
/**
 * 对键盘事件的处理
 * @param {string} key 修饰符名称
 */
function genFilterCode (key) {
  const keyVal = parseInt(key, 10)
  if (keyVal) {
    return `$event.keyCode!==${keyVal}`
  }
  const keyCode = keyCodes[key]
  const keyName = keyNames[key]
  // 拼接返回render函数
  return (
    `_k($event.keyCode,` + 
    `${JSON.stringify(key)},` + 
    `${JSON.stringify(keyCode)},` +
    `$event.key,` +
    `${JSON.stringify(keyName)}` +
    ')'
  )
}
