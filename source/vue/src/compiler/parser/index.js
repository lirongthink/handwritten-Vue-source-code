import he from 'he'
import { parseHTML } from "./html-parser";
import { extend } from "../../shared/util";
import { getAndRemoveAttr, getBindingAttr, pluckModuleFunction } from "../helpers";
import { parseText } from "./text-parser";

export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g
const lineBreakRE = /[\r\n]/
const whitespaceRE = /\s+/g

let platformIsPreTag
let postTransforms

const stack = []
let root
let currentParent
let inVPre = false
let inPre = false
let delimiters

function makeAttrsMap (attrs) {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

export function createASTElement(tag, attrs, parent) {
  return {
    type: 1,
    tag,
    attrsList:attrs,
    attrsMap:makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent,
    children:[]
  }
}

function isTextTag (el) {
  return el.tag === 'script' || el.tag === 'style'
}

export function parse(template, options) {


  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')
  platformIsPreTag = options.isPreTag || (() => false)
  const whitespaceOption = options.whitespace
  delimiters = options.delimiters
  function closeElement (element) {
    if (!inVPre) {
      element = processElement(element, options)
    }
    // 对树进行管理
    if (!stack.length && element !== root) {
      if (root.if && (element.elseif || element.else)) {
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        })
      }
    }
    if (currentParent && !element.forbidden) {
      if (element.elseif || element.else) {
        processIfConditions(element, currentParent)
      } else {
        currentParent.children.push(element)
        element.parent = currentParent
      }
    }

    if (element.pre) {
      inVPre = false
    }

    if (platformIsPreTag(element.tag)) {
      inPre = false
    }

    for (let i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options)
    }
  }
  parseHTML(template,{
    start (tag, attrs, unary, start) {
      //创建一个AST
      let element = createASTElement(tag, attrs, currentParent)
      // 对v-pre进行处理
      if (!inVPre) {
        processPre(element)
        if (element.pre) {
          inVPre = true
        }
      }
      if (inVPre) {
        // 处理未加工的属性
        processRawAttrs(element)
      } else if (!element.processed) {
        //处理v-for属性
        processFor(element)
        //处理v-if属性
        processIf(element)
        //处理v-once属性
        processOnce(element)
      }
      if (!root) {
        root = element
      }
      //是否为元信息标签
      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        closeElement(element)
      }
    },
    end(tag, start, end){
      const element = stack[stack.length - 1]
      if (!inPre) {
        //移除空白节点
        const lastNode = element.children[element.children.length - 1]
        if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
          element.children.pop()
        }
      }
      // 出栈
      stack.length -= 1
      currentParent = stack[stack.length - 1]
      closeElement(element)
    },
    chars(text, start, end){
      if (!currentParent) {
        return
      }
      if (currentParent.tag === 'textarea' && currentParent.attrsMap.placeholder === text) {
        return
      }
      const children = currentParent.children
      if (inPre || text.trim()) {
        text = isTextTag(currentParent) ? text : he.decode(text)
      } else if (!children.length){
        text = ''
      } else if (whitespaceOption) {
        if (whitespaceOption === 'condense') {
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        text = preserveWhitespace ? ' ' : ''
      }
      if (text) {
        if (whitespaceOption === 'condense') {
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        let child
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
          }
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text
          }
        }
        if (child) {
          children.push(child)
        }
      }
    },
    comment(text, start, end) {
      const child = {
        type: 3,
        text,
        isComment:true
      }
      currentParent.children.push(child)
    }
  })
  return root
}

function processIfConditions (el, parent) {
  const prev = findPrevElement(parent.children)
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp:el.elseif,
      block:el
    })
  }
}

function findPrevElement(children) {
  let i = children.length
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      children.pop()
    }
  }
}

function processPre(el) {
  //获取指令并移除指令相对应的字符串
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true
  }
}

function processRawAttrs (el) {
  // 获取AST的属性列表
  const list = el.attrsList
  const len = list.length
  if (len) {
    const attrs = el.attrs = new Array(len)
    for (let i = 0; i < len; i++) {
      attrs[i] = {
        name: list[i].name,
        value: JSON.stringify(list[i].value)
      }
      if (list[i].start != null) {
        attrs[i].start = list[i].start
        attrs[i].end = list[i].end
      }
    }
  } else if (!el.pre) {
    //根节点没有属性
    el.plain = true
  }
}

function processIf(el) {
  //匹配并移除v-if的节点
  const exp = getAndRemoveAttr(el, 'v-if')
  if (exp) {
    el.if = exp
    addIfCondition(el, {
      exp:exp,
      block:el
    })
  } else {
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true
    }
    const elseif = getAndRemoveAttr(el, 'v-else-if')
    if (elseif) {
      el.elseif = elseif
    }
  }
}

//对AST对象进行一些处理
export function processElement (element, options) {
  processKey(element)

  element.plain = (!element.key && !element.attrsList.length)

  processRef(element)
  processComponent(element)
  processRawAttrs(element)
   return element
}

function processKey(el) {
  const exp = getBindingAttr(el, 'key')
  if (exp) {
    el.key = exp
  }
}

function processRef(el) {
  const ref = getBindingAttr(el, 'ref')
  if (ref) {
    el.ref = ref
    // 检查它是否在v-for循环中
    el.refInFor = checkInFor(el)
  }
}

function checkInFor(el) {
  let parent = el
  while (parent) {
    if (parent.for !== undefined) {
      return true
    }
    parent = parent.parent
  }
  return false
}

function processComponent (el) {
  let binding
  //检测绑定的is属性
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding
  }
  //获取并移除inline-template属性
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true
  }
}

function processOnce (el) {
  const once = getAndRemoveAttr(el, 'v-once')
  if (once != null) {
    el.once = true
  }
}

export function processFor (el) {
  let exp
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    const res = parseFor(exp)
    if (res) {
      extend(el, res)
    }
  }
}

export function addIfCondition(el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}

export function parseFor (exp) {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return
  const res = {}
  res.for = inMatch[2].trim()
  const alias = inMatch[1].trim().replace(stripParensRE, '')
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim()
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    res.alias = alias
  }
  return res
}
