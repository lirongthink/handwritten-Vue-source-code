import { isDef } from "../../../shared/util";
import { isAsyncPlaceholder } from "./is-async-placeholder";

export function getFirstComponentChild (children) {
  // 判断传入的是否是一个数组
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      // 返回第一个为组件或是为注释的节点
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}
