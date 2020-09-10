import { observe, defineReactive } from "../observer/index";
import { proxy } from "../utils";
import Watcher from "../observer/watcher";
import Dep from "../observer/dep";

export function proxy(vm,source,key) { //代理数据  vm.msg = vm._data.msg
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
  }
}
function initMethods(vm) {
  
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
  for (const key in data) {
    proxy(vm,'_data',key)
  }

  observe(vm._data);// 观察数据
}
function createComputedGetter(vm,key) {
  let watcher = vm._watchersComputed[key] //这个watcher 就是定义的计算属性watcher
  return function () { // 用户取值是会执行此方法
    console.log('执行')
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
  let watchers = vm._watchersComputed =  Object.create(null) //创建存储计算属性的watcher的对象
  let keys = Object.keys(computed)
  keys.forEach(key =>{
    let userDef = computed[key]
    // new Watcher什么都不会做 配置了lazy dirty
    watchers[key] = new Watcher(vm,userDef,()=>{},{ lazy: true} )// lazy标识计算属性watcher 默认刚开始这个方法不会执行
    console.log('设置计算属性')
    //将计算属性的值定义到vm上
    Object.defineProperty(vm,key,{
      get: createComputedGetter(vm,key)
    })
  })
}
function creatWatcher(vm,key,handler) {
  //内部最终也会使用$watch
  return vm.$watch(key,handler)
}
function initWatch(vm) {
  let watch = vm.$options.watch  // 获取用户传入的watch属性
  const keys = Object.keys(watch)
  keys.forEach(key => {
    let userDef = watch[key]
    let handler = userDef
    if (userDef.handler) {
      handler = userDef.handler
    }
    creatWatcher(vm,key,handler,{ immediate: userDef.immediate })
  })
}

export function getData (data,vm) {
  
  return data.call(vm)
}
