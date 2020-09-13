import { renderStatic } from './render-static'
import { createTextVNode, createEmptyVNode } from '../../vdom/vnode';
import { toString } from '../../../shared/util';

export function installRenderHelpers (target) {
  target._s = toString
  target._m = renderStatic
  target._v = createTextVNode
  target._e = createEmptyVNode
}
