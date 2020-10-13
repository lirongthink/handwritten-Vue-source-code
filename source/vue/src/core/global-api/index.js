import { nextTick } from "../utils/next-tick";
import { set } from "../observer";
import { ASSET_TYPES } from "../../shared/constants copy";

export function initGlobalAPI(Vue) {

  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  Vue.set = set
  Vue.nextTick = nextTick

  Vue.options._base = Vue

}
