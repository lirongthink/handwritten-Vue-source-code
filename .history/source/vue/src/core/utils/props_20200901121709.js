export function validateProp(key, propOptions, propsData, vm) {
  const prop = propOptions[key]
  const absent
}

function getType(fn) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
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
