import Vue from "./runtime/index.js";
import { query } from "../../core/utils/index.js";
import { compileToFunctions } from "./compiler/index";
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from "./util/compat";

const idToTemplate = function (id) {
  const el = query(id)
  return el && el.innerHTML
}
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (el) {
  //获取挂载的元素
  el = el && query(el)
  //判断是否为body元素 直接返回  不能把Vue实例挂载到body上
  if (el === document.body || el === document.documentElement) {
    return this
  }
  //拿到配置项
  const options = this.$options
  //配置项中没有传入渲染函数
  if (!options.render) {
    let template = options.template
    //存在模板
    if (template) {
      if (typeof template === 'string') { // 传入的模板是一个选择器
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
        }
      } else if (template.nodeType) {//传入的模板是dom节点
        template = template.innerHTML
      } else {
        return this
      }
    } else if (el) {
      //获取它的父元素
      template = getOuterHTML(el)
    }
    //如果最后获取到了模板
    if (template) {
      //调用模板解析函数 获取相应的渲染函数代码 和静态渲染函数代码
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      //添加到配置项上
      options.render = render
      options.staticRenderFns = staticRenderFns
    }
  }
  return mount.call(this, el)
}

function getOuterHTML (el) {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
