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

export function toString (val) {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

export function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

function polyfillBind (fn, ctx) {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind (fn, ctx) {
  return fn.bind(ctx)
}

export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind



export const emptyObject = Object.freeze({})

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function toNumber (val) {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

export function looseEqual (a, b) {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

export function looseIndexOf (arr, val) {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

const hyphenateRE = /\B([A-Z])/g
export const hyphenate = (str) => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
}

export const identity = (_) => _

export function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
export const isBuiltInTag = makeMap('slot,component', true)

export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

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

export function genStaticKeys (modules) {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

export function makeMap (str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}
const camelizeRE = /-(\w)/g
export const camelize = (str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

export function toArray (list, start) {
  // 尾部开始的位置
  start = start || 0
  let i = list.length - start
  // 新建一个数组
  const ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  // 返回新数组
  return ret
}
/**
 * 将数组转化成对象
 * @param {Array} arr 传入的数组
 */
export function toObject (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}
