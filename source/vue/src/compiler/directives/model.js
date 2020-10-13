
export function genComponentModel(el, value, modifiers) {
  const { number, trim } = modifiers || {}
  const baseValueExpression = '$$v'
  let valueExpression = baseValueExpression
  // 判断trim修饰符
  if (trim) {
    valueExpression =
      `(typeof ${baseValueExpression} === 'string'` +
      `? ${baseValueExpression}.trim()` +
      `: ${baseValueExpression})`
  }
  // 判断number修饰符
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }

  const assignment = genAssignmentCode(value, valueExpression)

  // 返回代码串  为el.model 进行赋值  这样在后面就能进行处理
  el.model = {
    value: `(${value})`,
    expression: JSON.stringify(value),
    callback: `function (${baseValueExpression}) {${assignment}}`
  }
}


export function genAssignmentCode(value, assignment) {
  const res = parseModel(value)
  if (res.key === null) {
    return `${value}=${assignment}`
  } else {
    return `$set(${res.exp}, ${res.key}, ${assignment})`
  }
}

let len, str, chr, index, expressionPos, expressionEndPos



/**
 * 对v-model绑定的值的多种方式进行处理
 *
 * Possible cases:
 *
 * - test
 * - test[key]
 * - test[test1[key]]
 * - test["a"][key]
 * - xxx.test[a[a].test1[key]]
 * - test.xxx.a["asa"][test1[key]]
 *
 */
export function parseModel(val) {
  // 去掉首尾空格
  val = val.trim()
  // 截掉空格之后的值
  len = val.length

  // 判断不是[]的形式访问属性
  if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
    // 确定.的位置
    index = val.lastIndexOf('.')
    if (index > -1) { // 是使用.进行属性访问
      // 提出最后的属性
      return {
        exp: val.slice(0, index),
        key:'"' + val.slice(index + 1) + '"'
      }
    } else {
      // 直接返回这个值
      return {
        exp: val,
        key: null
      }
    }
  }

  str = val
  index = expressionPos = expressionEndPos = 0

  while (index < len) {
    // 取出字符串最前面的字符
    chr = next()
    // 是以"或'开头 即为字符串
    if (isStringStart(chr)) {
      parseString(chr)
    } else if (chr === 0x5B) { // 以[开头
      parseBracket(chr)
    }
  }

  return {
    exp: val.slice(0, expressionPos),
    key: val.slice(expressionPos + 1, expressionEndPos)
  }

}

function next() {
  return str.charCodeAt(++index)
}

function isStringStart(chr) {
  // 单引号或者双引号
  return chr === 0x22 || chr === 0x27
}

function parseString(chr) {
  //传入单引号或双引号
  const stringQuote = chr
  // 一直循环 后面的第一个单引号或双引号
  while (index < len) {
    chr = next()
    if (chr === stringQuote) {
      break
    }
  }
}

function parseBracket(chr) {
  // 记录中括号的数量
  let inBracket = 1
  // 记录表达式开始位置
  expressionPos = index
  while (index < len) {
    chr = next()
    // 检测到引号  处理
    if (isStringStart(chr)) {
      parseString(chr)
      continue
    }
    // 检测到前中括号 增加
    if (chr === 0x5B) inBracket++
    // 检测到后中括号 减少
    if (chr === 0x5D) inBracket--

    if (inBracket === 0) {
      // 记录表达式结束位置
      expressionEndPos = index
      break
    }
  }
}
