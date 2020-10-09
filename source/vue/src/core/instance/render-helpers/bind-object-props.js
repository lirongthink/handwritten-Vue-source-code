/* @flow */

import { isReservedAttribute, camelize, toObject } from '../../../shared/util';

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
export function bindObjectProps (data, tag, value, asProp, isSync) {
  if (value) {
    if (Array.isArray(value)) {
      value = toObject(value)
    }
    let hash
    for (const key in value) {
      if (
        key === 'class' ||
        key === 'style' ||
        isReservedAttribute(key)
      ) {
        hash = data
      } else {
        hash = asProp || false
          ? data.domProps || (data.domProps = {})
          : data.attrs || (data.attrs = {})
      }
      const camelizedKey = camelize(key)
      if (!(key in hash) && !(camelizedKey in hash)) {
        hash[key] = value[key]

        if (isSync) {
          const on = data.on || (data.on = {})
          on[`update:${camelizedKey}`] = function ($event) {
            value[key] = $event
          }
        }
      }
    }
  }
  return data
}
