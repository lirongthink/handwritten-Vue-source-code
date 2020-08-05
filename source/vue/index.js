import { initMixin } from "./init";
function Vue(options) { //vue中原始用户传入的数据
  //初始化vue 并且将用户选项传入
  this._init(options)
  const vm = this
  vm.$options = options
}
initMixin(Vue)
export default Vue
