import { pushTarget, popTarget } from "./dep";
import { nextTick } from "../utils/nextTick";
import { getValue } from "../utils/index";

let id = 0 //保证watcher唯一
class Watcher {
  constructor(vm,exprOrFn,cb = () =>{},opts = {}){
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.cb = cb
    this.deps = []
    this.depsId = new Set()
    this.opts = opts
    this.id = id++
    this.immediate = opts.immediate
    this.lazy = opts.lazy //如果这个值为true 说明他是计算属性
    this.dirty = this.lazy
    if (typeof exprOrFn === 'function') {
      this.getter = exprOrFn // getter 就是new Watcher传入的第二个参数
    } else {
      this.getter = function () {
        return getValue(vm,exprOrFn)
      }
    }
    if (opts.user) { //标识用户自己写的watcher
      this.user = true
    }
    // 创建watcher时先把对应的值取出来   oldValue
    // 如果当前时计算属性 不会默认调用get方法
    this.value = this.lazy ? undefined : this.get() //默认创建一个watcher 会调用自身的get方法
    if (this.immediate) { //如果有immediate  就直接运行定义的值  没有老值
      this.cb(this.value)
    }
  }
  get(){
    pushTarget(this) //渲染watcher Dep.target = watcher
    //默认创建watcher会执行此方法
    //这个函数调用时就会将当前计算属性watcher 存起来
    let value = this.getter.call(this.vm) //让这个当前传入的函数执行
    popTarget()
    return value
  }
  evaluate(){
    this.value = this.get()
    this.dirty = false
  }
  addDep(dep){ //同一个watcher 不应该重复记录dep
    let id = dep.id
    if (!this.depsId.has(id)) {
      this.depsId.add(id)
      this.deps.push(dep) //watcher 记住了当前的dep
      dep.addSub(this)
    }
  }
  depend(){
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }
  update(){ // 如果立即调用get 会导致页面重复渲染  异步来更新
    if (this.lazy) { // 如果是计算属性
      this.dirty = true
    }
    queueWatcher(this)
  }
  run() {
    let value = this.get() //newValue
    if (this.value !== value) {
      this.cb(value,this.value)
    }
  }
}

let has = {}
let queue = []

function flushQueue() {
  // 等待当前这一轮全部更新后 再去让watcher 依次执行
  queue.forEach(watcher => watcher.run())
}

function queueWatcher(watcher) { //对重复的watcher进行过滤操作
  let id = watcher.id
  if (has[id] == null) {
    has[id] = true
    queue.push(watcher) // 相同watcher只会存一个到queue中

    // 延迟清空队列
    nextTick(flushQueue)
  }
}

// 渲染使用  计算属性使用  vm.watch也用
export default Watcher
