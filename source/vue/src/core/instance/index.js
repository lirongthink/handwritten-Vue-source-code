import { initMixin } from "./init";
import { stateMixin } from "./state";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
function Vue(options) { //vue中原始用户传入的数据
  //初始化vue 并且将用户选项传入
  this._init(options)
  // const vm = this
  // vm.$options = options
}
// 混入一些全局属性和方法
initMixin(Vue)
stateMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
