import { hasOwn } from "../../shared/util";
import { observe } from "../observer";

export function validateProp(key, propOptions, propsData, vm) {
  // prop的配置
  const prop = propOptions[key]
  const absent = !hasOwn(propsData, key)
  // 动态设置的属性值
  let value = propsData[key]

  // 检查属性设置的type是否为boolean  这里对布尔值进行处理
  const booleanIndex = getTypeIndex(Boolean, prop.type)
  if (booleanIndex > -1) {
    // 如果属性没有传值  也没有设置默认值  则设置为false
    if (absent && !hasOwn(prop, 'default')) {
      value = false
    }
  }
  // 这里检测是否有默认值 有就返回默认值
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key)

    observe(value)
  }

  return value
}

function getType(fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}

function getPropDefaultValue(vm, prop, key) {
  //没有配置默认值 直接返回undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  // 取出默认值选项
  const def = prop.default
  // 如果当前的数据中没有值  但是之前存储的数据中有值  则使用之前的值
  if (vm && vm.$options.propsData && vm.$options.propsData[key] === undefined && vm._props[key] !== undefined) {
    return vm._props[key]
  }
  // 因为对象的默认值需要设置一个函数，所以这里处理函数
  return typeof def === 'function' && getType(prop.type) !== 'Function' ? def.call(vm) : def
}

function isSameType(a, b) {
  return getTypeIndex(a) === getType(b)
}

/**
 * 判断类型是否符合要求
 * @param {String} type 
 * @param {String | Array} expectedTypes 
 */
function getTypeIndex(type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes,type) ? 0 : -1
  }
  for (let i = 0; i < expectedTypes.length; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}
