import { pushTarget, popTarget } from "./dep";
import { parsePath, isObject } from "../utils/index";
import { queueWatcher } from "./scheduler";
import { remove } from "../../shared/util";

let id = 0 //保证watcher唯一
class Watcher {
  constructor(vm,exprOrFn,cb = () =>{},opts = {},isRenderWatcher){
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    this.exprOrFn = exprOrFn
    this.cb = cb
    this.deps = []
    // 两个new的属性是用来清除本轮不用的dep
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.opts = opts
    this.id = id++
    this.active = true
    this.immediate = opts.immediate
    this.lazy = opts.lazy //如果这个值为true 说明他是计算属性
    this.dirty = this.lazy
    if (typeof exprOrFn === 'function') {
      this.getter = exprOrFn // getter 就是new Watcher传入的第二个参数
    } else {
      this.getter = function () {
        return parsePath(vm,exprOrFn)
      }
    }
    if (opts.user) { //标识用户自己写的watcher
      this.user = true
    }
    // 创建watcher时先把对应的值取出来   oldValue
    // 如果当前时计算属性 不会默认调用get方法
    this.value = this.lazy ? undefined : this.get() //默认创建一个watcher 会调用自身的get方法
    // if (this.immediate) { //如果有immediate  就直接运行定义的值  没有老值
    //   this.cb(this.value)
    // }
  }
  get(){
    pushTarget(this) //渲染watcher Dep.target = watcher
    const vm = this.vm
    //默认创建watcher会执行此方法
    //这个函数调用时就会将当前计算属性watcher 存起来
    let value = this.getter.call(vm, vm) //让这个当前传入的函数执行
    popTarget()

    // 做一个优化
    this.cleanupDeps()
    return value
  }
  evaluate(){
    this.value = this.get()
    this.dirty = false
  }
  addDep(dep){ //同一个watcher 不应该重复记录dep
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep) //watcher 记住了当前的dep
      if (!this.depIds.has(id)) {
        dep.addSub(this)        
      }
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
    } else {
      queueWatcher(this)
    }
  }
  run() {
    if (this.active) {
      const value = this.get() //newValue
      if (this.value !== value || isObject(value)) {
        const oldValue = this.value
        this.value = value
        this.cb.call(this.vm, value, oldValue)
      }
    }
  }
  // 这里做了一个优化 如果本轮不需要监听的dep  就把他清除
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }
  // 取消渲染的监听
  teardown(){
    //是否为活动的watcher
    if (this.active) {
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      // 循环从包含这个watcher的 dep中清除自己
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      //设置为不活动的
      this.active = false
    }
  }
}




// 渲染使用  计算属性使用  vm.watch也用
export default Watcher
