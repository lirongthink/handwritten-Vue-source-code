import he from 'he'
import { parseHTML } from "./html-parser";
import { extend, camelize } from "../../shared/util";
import { getAndRemoveAttr, getBindingAttr, pluckModuleFunction, addHandler, addDirective, addAttr, addProp } from "../helpers";
import { parseText } from "./text-parser";
import { parseFilters } from './filter-parser';

export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
export const onRE = /^@|^v-on:/
export const dirRE = /^v-|^@|^:|^\./

const argRE = /:(.*)$/
export const bindRE = /^:|^\.|^v-bind:/
const propBindRE = /^\./
const modifierRE = /\.[^.]+/g



const stripParensRE = /^\(|\)$/g
const lineBreakRE = /[\r\n]/
const whitespaceRE = /\s+/g

let transforms
let platformIsPreTag
let postTransforms
let platformMustUseProp

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

/**
 * 解析指令
 * @param {ASTElement} el 
 */
function processAttrs(el) {
  // 拿到解析出的属性列表
  const list = el.attrsList
  let i, l, name, rawName, value, modifiers, isProp, syncGen
  // 遍历属性列表
  for (i = 0, l = list.length; i < l; i++) {
    name = rawName = list[i].name
    value = list[i].value
    // 判断 是否是 指令或是事件
    if (dirRE.test(name)) {
      //标记元素为动态节点
      el.hasBindings = true
      // 截取掉前面的符号 并去匹配找出所有修饰符
      modifiers = parseModifiers(name.replace(dirRE,''))
      // 处理.prop
      if (propBindRE.test(name)) {
        (modifiers || (modifiers = {})).prop = true
        name = `.` + name.slice(1).replace(modifierRE, '')
      } else if (modifiers) {
        // 将处理完后的修饰符截取掉
        name = name.replace(modifierRE, '')
      }
      // 处理v-bind
      if (bindRE.test(name)) {
        // name = name.replace(bindRE, '')
        // value = parseFilters(value)
        // isProp = false
        // if (modifiers) {
        //   if (modifiers.prop) {
        //     isProp = true
        //     name = camelize(name)
        //     if (name === 'innerHtml') name = 'innerHtml'
        //   }
        //   if (modifiers.camel) {
        //     name = camelize(name)
        //   }
        //   if (modifiers.sync) {
        //     syncGen = gen
        //   }
        // }
      } else if (onRE.test(name)) { // 处理v-on  对绑定的事件进行处理
        // 截取掉on的符号
        name = name.replace(onRE, '')
        // 添加事件获为其添加回调
        addHandler(el, name, value, modifiers, false, list[i])
      } else {// 正常指令 如v-model
        // 截掉指令
        name = name.replace(dirRE, '')
        const argMatch = name.match(argRE)
        const arg = argMatch && argMatch[1]

        if (arg) {
          name = name.slice(0, -(arg.length + 1))
        }
        // 添加指令
        addDirective(el, name, rawName, value, arg, modifiers, list[i])
      }
    } else {
      addAttr(el, name, JSON.stringify(value), list[i])
      
      if (!el.component &&
        name === 'muted' &&
        platformMustUseProp(el.tag, el.attrsMap.type, name)) {
          addProp(el, name, 'true', list[i])
      }
    }
  }
}

function parseModifiers(name) {
  // 捕获修饰符
  const match = name.match(modifierRE)
  if (match) {
    const ret = {}
    // 循环 将修饰符的.截取掉并放入对象返回
    match.forEach(m => { ret[m.slice(1)] = true })
    return ret
  }
}

export function parse(template, options) {

  transforms = pluckModuleFunction(options.modules, 'transformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')
  platformIsPreTag = options.isPreTag || (() => false)
  platformMustUseProp = options.mustUseProp || (() => false)
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
  for (let i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element
  }
  // 处理事件或bind等属性
  processAttrs(element)
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
