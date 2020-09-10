import { nextTick } from "../utils/next-tick";
import { set } from "../observer";

export function initGlobalAPI(Vue) {
  Vue.options._base = Vue
  Vue.set = set
  Vue.nextTick = nextTick
}
