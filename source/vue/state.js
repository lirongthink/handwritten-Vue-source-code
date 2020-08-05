import { observe } from "./observe/index";
import { proxy } from "./utils";
import Watcher from "./observe/watcher";
import Dep from "./observe/dep";
export function initState(vm) {
  //做不同的初始化工作
  const opts = vm.$options

  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethods(vm)
  }
  if (opts.data) {
    initData(vm)  //初始化数据
  }
  if (opts.computed) {
    initComputed(vm)  //初始化计算属性
  }
  if (opts.watch) {
    initWatch(vm) //初始化watch
  }

}
function initProps(vm) {
  
}
function initMethods(vm) {
  
}
function initData(vm) { // 将用户插入的数据  通过Object.defineProperty重新定义
  let data = vm.$options.data; // 用户传入的data

  // 判断传入的data是函数还是对象   处理之后重新赋值
  // 将新值存储到一个新的对象_data中   不去更改用处传入的原对象

  data = vm._data =  typeof data === 'function' ? data.call(this) : data || {}

  //不去多调用一层_data  设置代理 vm. 直接获取到 vm._data.
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
