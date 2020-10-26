import { renderStatic } from './render-static'
import { createTextVNode, createEmptyVNode } from '../../vdom/vnode';
import { toString, toNumber, looseEqual, looseIndexOf } from '../../../shared/util';
import { bindObjectProps } from './bind-object-props';
import { bindObjectListeners } from './bind-object-listeners';
import { resolveFilter } from './resolve-filter';
import { checkKeyCodes } from './check-keycodes';
import { renderSlot } from './render-slot';
import { resolveScopedSlots } from './resolve-slots';

export function installRenderHelpers (target) {
  target._n = toNumber
  target._s = toString
  target._t = renderSlot
  target._q = looseEqual
  target._i = looseIndexOf
  target._m = renderStatic
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode
  target._e = createEmptyVNode
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  
}
