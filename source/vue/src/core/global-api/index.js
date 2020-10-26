import { nextTick } from "../utils/next-tick";
import { set } from "../observer";
import { ASSET_TYPES } from "../../shared/constants";
import { extend } from "../../shared/util";
import builtInComponents from '../components/index'
import { initAssetRegisters } from "./assets";
import { initExtend } from "./extend";

export function initGlobalAPI(Vue) {

  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  Vue.set = set
  Vue.nextTick = nextTick

  Vue.options._base = Vue

  // 将keep-alive组件注册到全局
  extend(Vue.options.components, builtInComponents)

  initExtend(Vue)
  initAssetRegisters(Vue)
}
