import { isNonPhrasingTag } from "../../platforms/web/compiler";
import { makeMap } from "../../shared/util";
const unicodeLetters = 'a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD'
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeLetters}]*`
const comment = /^<!\--/
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i

export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
}
const encodedAttr = /&(?:lt|gt|quot|amp);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g

const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

function decodeAttr(value, shouldDecodeNewLines) {
  const re = shouldDecodeNewLines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, match => decodingMap[match])
}

export function parseHTML(html, options) {
  // 存储标签的栈
  const stack = []
  const expectHTML = options.expectHTML
  const isUnaryTag = options.isUnaryTag || (() => false)
  const canBeLeftOpenTag = options.canBeLeftOpenTag || (() => false)
  let index = 0
  let last, lastTag
  while (html) {
    // 记录最后的字符
    last = html
    //如果没有最后标签  或者最后标签不是script、style、textarea
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // 匹配开始标签的尖括号
      let textEnd = html.indexOf('<')
      //如果字符串开头就已经是开始标签
      if (textEnd === 0) {
        if (comment.test(html)) {
          //查找注释标签的结束符
          const commentEnd = html.indexOf('-->')
          // 如果字符串中存在注释标签的结束符
          if (commentEnd >= 0) {
            advance(commentEnd + 3)
            // 注释节点处理结束  跳出本轮循环
            continue
          }
        }

        //对Doctype的处理
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }
        // 注意这里优先处理结束标签  再去处理开始标签 正好是一个栈结构
        //对结束标签的处理
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // 对开始标签的处理
        const startTagMatch = parseStartTag()
        // 如果匹配到了开始标签
        if (startTagMatch) {
          //处理开始标签
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }


      let text, rest, next
      if (textEnd >= 0) {
        //截取尖括号向后的部分
        rest = html.slice(textEnd)
        // 循环检测 如果还有尖括号 则循环截取
        while (!endTag.test(rest) && !startTagOpen.test(rest) && !comment.test(rest)) {
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
      }
      
      //如果开始就没有匹配到尖括号
      if (textEnd < 0) {
        //此时为文本节点 直接赋值给文本
        text = html
      }
      // 如果是文本节点 直接移动到末尾
      if (text) {
        advance(text.length)
      }
      //如果有chars方法传入 而且是文本节点 则执行chars
      if (options.chars && text) {
        options.chars(text, index - text.length, index)
      }
    } else {
      let endTagLength = 0
      const stackedTag = lastTag.toLowerCase()
      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag != 'noscript') {
          text = text.replace(/<!\--([\s\S]*?)-->/g, '$1').replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag(stackedTag, index - endTagLength, index)
    }
    if (html === last) {
      options.chars && options.chars(html)
      break
    }
  }
  parseEndTag()
  
  function advance(n) {
    index += n
    // 字符串裁剪并替换
    html = html.substring(n)
  }

  function parseStartTag() {
    //解析开始标签
    const start = html.match(startTagOpen)
    if (start) {
      //创建AST树
      const match = {
        tagName:start[1],
        attrs:[],
        start:index
      }
      //字符串向前移动 重置字符串
      advance(start[0].length)
      let end, attr
      // 一直到没有匹配到结束标签 而且有属性值
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        // 记录属性的开始位置
        attr.start = index
        // 字符串向前移动
        advance(attr[0].length)
        //记录属性的结束位置
        attr.end = index
        // 将属性信息添加到AST对象中
        match.attrs.push(attr)
      }
      //如果最后有结束标签
      if (end) {
        match.unarySlash = end[1]
        // 将最后的结束标签向后移动
        advance(end[0].length)
        // 记录结束标签位置
        match.end = index
        //返回这个AST对象
        return match
      }
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }
    // 是否为元信息标签
    const unary = isUnaryTag(tagName)

    // 计算属性数组的长度
    const l = match.attrs.length
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      const value = args[3] || args[4] || args[5] || ''
      const shouldDecodeNewLines = tagName === 'a' && args[1] === 'href' ? options.shouldDecodeNewLinesForHref : options.shouldDecodeNewLines
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewLines)
      }
    }
    //如果不是元信息标签
    if (!unary) {
      //将标签入栈
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end})
      //设置最后的标签为此标签
      lastTag = tagName
    }
    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  function parseEndTag(tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index
    // 如果标签名存在
    if (tagName) {
      //将标签名转换成小写
      lowerCasedTagName = tagName.toLowerCase()
      //从栈中找出标签名的位置
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      //标签不存在则将位置置为0
      pos = 0
    }

    if (pos >= 0) {
      // 闭合他之前的所有标签
      for (let i = stack.length - 1; i >= pos; i--) {
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      //移除所有的打开标签
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }

  }
}
