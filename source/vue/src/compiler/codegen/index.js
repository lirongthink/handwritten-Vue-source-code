import { pluckModuleFunction } from "../helpers"

export class CodegenState {
  constructor(options) {
    this.options = options
    this.transforms = pluckModuleFunction(options.modules, 'transformCode')
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
    const isReservedTag = options.isReservedTag || (() => false)
    this.maybeComponent = () => !!el.component | !isReservedTag(el.tag)
    this.onceId = 0
    this.staticRenderFns = []
    this.pre = false
  }
}

export function generate(ast, options) {
  const state = new CodegenState(options)
  //是否存在AST 如果存在 则解析生成代码字符串  否则返回一个创建空div的代码
  const code = ast ? genElement(ast, state) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}
export function genElement(el, state) {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre
  }
  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else {
    let code
    //如果是组件
    if (el.component) {
      //解析组件
      code = genComponent(el.component, el, state)
    } else {
      let data
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        data = genData(el, state)
      }
      //解析子节点的AST
      const children = el.inlineTemplate ? null : genChildren(el, state, true)
      // 生成代码
      code = `_c('${el.tag}'${
        data ? `,${data}` : ''
      }${
        children ? `,${children}` : ''
      })`
    }
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code)
    }
    return code
  }
}

export function genChildren(el, state, checkSkip, altGenElement, altGenNode) {
  // 取出子节点
  const children = el.children
  if (children.length) {
    const el = children[0]
    if (children.length === 1 && el.for && el.tag !== 'template') {
      const normalizationType = checkSkip ? state.maybeComponent(el) ? ',1' : ',0' : ''
      return `${(altGenElement || genElement)(el, state)}${normalizationType}`
    }
    const normalizationType = checkSkip ? getNormalizationType(children, state.maybeComponent) : 0
    const gen = altGenNode || genNode
    return `[${children.map(c => gen(c, state)).join(',')}]${
      normalizationType ? `,${normalizationType}` : ''
    }`
  }
}

function getNormalizationType (children, maybeComponent) {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el = children[i]
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
        (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }
    if (maybeComponent(el) ||
        (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1
    }
  }
  return res
}

function needsNormalization (el) {
  return el.for !== undefined || el.tag === 'template'
}

function genNode(node, state) {
  if (node.type === 1) {
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

export function genText (text) {
  return `_v(${text.type === 2
    ? text.expression
    : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

export function genComment (comment) {
  return `_e(${JSON.stringify(comment.text)})`
}

function genStatic (el, state) {
  // 标记设置为true 防止造成死循环
  el.staticProcessed = true
  //处理v-pre指令节点的情况
  const originalPreState = state.pre
  if (el.pre) {
    state.pre = el.pre
  }
  state.staticRenderFns.push(`with(this){return ${genElement(el, state)}}`)
  state.pre = originalPreState
  return `_m(${
    state.staticRenderFns.length - 1
  }${
    el.staticInFor ? ',true' : ''
  })`
}

export function genData(el, state) {
  let data = '{'
  //对指令的处理
  // const dirs = genDirectives(el, state)
  // if (dirs) data += dirs + ','

  // 对key的处理
  if (el.key) {
    data += `key:${el.key},`
  }
  //对ref的处理
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  //对pre的处理
  if (el.pre) {
    data += `pre:true,`
  }
  // 使用is记录组件原始的标签名
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  for (let i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el)
  }
  //对属性的处理
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}},`
  }
  // 对dom属性的处理
  if (el.props) {
    data += `domProps:{${genProps(el.props)}},`
  }

  data = data.replace(/,$/, '') + '}'

  return data
}
function genComponent(componentName, el, state) {
  const children = el.inlineTemplate ? null : genChildren(el, state, true)
  return `_c(${componentName},${genData(el, state)}${
    children ? `,${children}` : ''
  })`
}

function genProps(props) {
  let res = ''
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    res += `"${prop.name}":${transformSpecialNewlines(value)}`
  }
  return res.slice(0, -1)
}

function transformSpecialNewlines (text) {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}