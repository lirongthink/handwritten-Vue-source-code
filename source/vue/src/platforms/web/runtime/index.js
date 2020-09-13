import Vue from "../../../core/instance";
import { query } from "../../../core/utils";
import { mountComponent } from "../../../core/instance/lifecycle";
import { patch } from "./patch";


Vue.prototype.__patch__ = patch

Vue.prototype.$mount = function (el) {
  el = query(el) || undefined
  return mountComponent(this, el)
}

export default Vue
