export function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

export function isDef (v){
  return v !== undefined && v !== null
}

export function isTrue (v){
  return v === true
}

export function isFalse (v){
  return v === false
}

export function isUndef (v){
  return v === undefined || v === null
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}

const _toString = Object.prototype.toString

export function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}


export function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
export const isBuiltInTag = makeMap('slot,component', true)

//判断数组的下标是否合法
export function isValidArrayIndex(val) {
  const n = parseFloat(String(val))
  // 大于0 而且不是小数  而且不是无穷数
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

export function extend (to, _from) {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

export function makeMap (str, expectsLowerCase){
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}
