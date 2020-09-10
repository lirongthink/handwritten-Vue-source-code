import { ASSET_TYPES } from "../../shared/constants";

export function initExtend(Vue) {
  Vue.cid = 0
  let cid = 1

  Vue.extend = function (extendOptions) { //目的是让组件拥有Vue的能力
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    //获取组件的名称
    const name = extendOptions.name || Super.options.name
    // //检查名称是否合法
    // validateComponentName(name)

    // 创建构造函数
    const Sub = function VueComponent(options) {
      //调用Vue实例上的init方法
      this._init(options)
    }
    //寄生组合式继承
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub

    Sub.cid = cid++
    Sub['super'] = Super

    // 将全局静态方法进行挂载
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })

    if (name) {
      Sub.options.components[name] = Sub
    }

    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    //缓存构造器
    cachedCtors[SuperId] = Sub
    return Sub
  }
}
