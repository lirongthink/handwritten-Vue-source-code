import Vue from "../../../core/index";
import { query } from "../../../core/utils";
import { mountComponent } from "../../../core/instance/lifecycle";
import platformDirectives from './directives/index'
import { patch } from "./patch";
import { extend } from "../../../shared/util";
extend(Vue.options.directives, platformDirectives)


Vue.prototype.__patch__ = patch

Vue.prototype.$mount = function (el) {
  el = query(el) || undefined
  return mountComponent(this, el)
}

export default Vue
