import { observe, defineReactive, set } from "../observer/index";
import Watcher from "../observer/watcher";
import Dep from "../observer/dep";
import { validateProp } from "../utils/props";
import { isPlainObject, hasOwn, bind } from "../../shared/util";


const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: () =>{},
  set: () =>{}
}

export function proxy(vm,source,key) { //代理数据  vm.msg = vm._data.msg
  console.log(key)
  Object.defineProperty(vm,key,{
    get(){
      return vm[source][key]
    },
    set(newValue){
      if (vm[source][key] === newValue) return
      vm[source][key] = newValue
    }
  })
}

export function initState(vm) {
  //做不同的初始化工作
  const opts = vm.$options

  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)  //初始化数据
  } else { // 如果没有传data的话  默认设置一个data
    observe(vm._data = {}) 
  }
  if (opts.computed) initComputed(vm, opts.computed)  //初始化计算属性
  if (opts.watch) {
    initWatch(vm) //初始化watch
  }

}
function initProps(vm, propsOptions) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}

  const keys = vm.$options._propKeys = []

  for (const key in propsOptions) {
    keys.push(key)
    // 获取属性的值
    const value = validateProp(key, propsOptions, propsData, vm)
    // 遍历属性进行监听
    defineReactive(props, key, value)

    //对_props进行代理
    if (!(key in vm)) {
      proxy(vm, '_props', key)
    }
  }
}
function initMethods(vm,methods) {
  const props = vm.$options.props
  // 循环遍历方法
  for (const key in methods) {
    if (typeof methods[key] !== 'function') {
      console.log(`Method "${key}" has type "${typeof methods[key]}" in the component definition.`)
    }
    if (props && hasOwn(props, key)) {
      console.log(`Method "${key}" has already been defined as a prop.`)
    }
    vm[key] = typeof methods[key] !== 'function' ? (() =>{}) : bind(methods[key], vm)
  }
}
function initData(vm) { // 将用户插入的数据  通过Object.defineProperty重新定义
  let data = vm.$options.data; // 用户传入的data

  // 判断传入的data是函数还是对象   处理之后重新赋值
  // 将新值存储到一个新的对象_data中   不去更改用处传入的原对象

  data = vm._data =  typeof data === 'function' ? getData(data,vm) : data || {}

  //如果data不是对象  做一下初始化
  if (Object.prototype.toString.call(data) !== '[object Object]') {
    data = {}
  }

  const keys = Object.keys(data)
  //比较一下methods和props中是否有冲突的属性  因为属性都要挂在到vm上
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    //如果方法名冲突  则报错
    if (methods && Object.prototype.hasOwnProperty.call(methods,key)) {
      throw new Error('methods中属性冲突！')
    }
    if (props && Object.prototype.hasOwnProperty.call(props,key)) {
      throw new Error('props中属性冲突！')
    } else if (Object.prototype.toString.call(key).charAt(0) !== '$' && Object.prototype.toString.call(key).charAt(0) !== '_') {//判断一下属性前缀 防止覆盖私有属性
      //不去多调用一层_data  设置代理 vm. 直接获取到 vm._data
      proxy(vm, '_data', key)
    }
  }
  // for (const key in data) {
  //   proxy(vm,'_data',key)
  // }

  observe(vm._data);// 观察数据
}
function createComputedGetter(vm,key) {
  return function computedGetter() { // 用户取值是会执行此方法
    const watcher = vm._computedWatchers[key] //这个watcher 就是定义的计算属性watcher
    if (watcher) {
      if (watcher.dirty) { // 如果页面取值了  而且dirty是true  就会调用watcher的get方法
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function initComputed(vm) {
  let computed = vm.$options.computed
  //将计算属性的配置  放到vm上
  let watchers = vm._computedWatchers =  Object.create(null) //创建存储计算属性的watcher的对象
  let keys = Object.keys(computed)
  keys.forEach(key =>{
    const userDef = computed[key]
    // 判断用户是否传入了get函数
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // new Watcher什么都不会做 配置了lazy dirty
    watchers[key] = new Watcher(vm, getter, ()=>{},{ lazy: true})// lazy标识计算属性watcher 默认刚开始这个方法不会执行
    // 如果vm实例上不存在该属性 将计算属性的值定义到vm上
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    }
  })
}

export function defineComputed(target, key, userDef) {
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(target, key)
    sharedPropertyDefinition.set = () =>{}
  } else {
    sharedPropertyDefinition.get = createComputedGetter(target, key)
    sharedPropertyDefinition.set = userDef.set || (() => {})
  }

  Object.defineProperty(target, key, sharedPropertyDefinition)
}


function initWatch(vm) {
  const watch = vm.$options.watch  // 获取用户传入的watch属性
  const keys = Object.keys(watch)
  keys.forEach(key => {
    const handler = watch[key]
    // 如果传入的是数组 就循环创建
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        creatWatcher(vm, key, handler[i])
      }
    } else {// 如果不是数组  直接创建
      creatWatcher(vm, key, handler)
    }
  })
}

function creatWatcher(vm, expOrFn, handler, options) {
  // 判断 如果用户设置的侦听器是一个对象
  if (isPlainObject(handler)) {
    options = handler
    handler = options.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }

  //内部最终也会使用$watch
  return vm.$watch(expOrFn, handler, options)
}


export function stateMixin(Vue) {
  const dataDef = {}
  dataDef.get = function () { return this._data} 
  const propsDef = {}
  propsDef.get = function () { return this._props}
  // 相当于做一层代理
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)
  // 混入$set
  Vue.prototype.$set = set
  // 混入$watch
  Vue.prototype.$watch = function (expOrFn, cb, options) {
    const vm = this
    if (isPlainObject(cb)) {
      return creatWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    //标识为用户watcher
    options.user = true
    // 创建用户watcher
    const watcher = new Watcher(vm, expOrFn, cb, options)
    //如果传入立即执行参数  则立即调用
    if (options.immediate) cb.call(vm, watcher.value)
    return function unwatchFn() {
      watcher.teardown()
    }
  }
}

export function getData (data,vm) {
  return data.call(vm)
}
