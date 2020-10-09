// 浏览器环境
export const inBrowser = typeof window !== 'undefined'
// 判断用户浏览器
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()
// ie
export const isIE = UA && /msie|trident/.test(UA)
// edge
export const isEdge = UA && UA.indexOf('edge/') > 0
// chrome
export const isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge

export let supportsPassive = false
if (inBrowser) {
  try {
    const opts = {}
    Object.defineProperty(opts, 'passive', ({
      get () {
        supportsPassive = true
      }
    }))
    window.addEventListener('test-passive', null, opts)
  } catch (e) {}
}
