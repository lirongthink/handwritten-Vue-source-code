import { isTextInputType } from "../../util/element";
import { isIE9 } from "../../../../core/utils/env";

const directive = {

  inserted (el, binding, vnode, oldVnode) {
    if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
      el._vModifiers = binding.modifiers
      if (!binding.modifiers.lazy) {
        /**
         * 文本合成系统如 input method editor（即输入法编辑器）开始新的输入合成时会触发 compositionstart 事件。
         * 例如，当用户使用拼音输入法开始输入汉字时，这个事件就会被触发。
         */
        el.addEventListener('compositionstart', onCompositionStart)
        el.addEventListener('compositionend', onCompositionEnd)
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        el.addEventListener('change', onCompositionEnd)
        /* istanbul ignore if */
        if (isIE9) {
          el.vmodel = true
        }
      }
    }
  }
  
}

function onCompositionStart (e) {
  e.target.composing = true
}

function onCompositionEnd (e) {
  // prevent triggering an input event for no reason
  if (!e.target.composing) return
  e.target.composing = false
  trigger(e.target, 'input')
}

function trigger (el, type) {
  const e = document.createEvent('HTMLEvents')
  e.initEvent(type, true, true)
  el.dispatchEvent(e)
}
export default directive
