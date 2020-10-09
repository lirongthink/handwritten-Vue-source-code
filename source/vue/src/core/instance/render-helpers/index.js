import { renderStatic } from './render-static'
import { createTextVNode, createEmptyVNode } from '../../vdom/vnode';
import { toString } from '../../../shared/util';
import { bindObjectProps } from './bind-object-props';
import { bindObjectListeners } from './bind-object-listeners';

export function installRenderHelpers (target) {
  target._s = toString
  target._m = renderStatic
  target._b = bindObjectProps
  target._v = createTextVNode
  target._e = createEmptyVNode
  target._g = bindObjectListeners
}
