import { isObject, def } from "../utils";
import { arrayMethods, dependArray } from "./array";
import Dep from "./dep";
import VNode from "../vdom/vnode";
import { hasOwn, isPlainObject, isValidArrayIndex } from "../../shared/util";

class Observer {
  constructor(value){
    //vue 如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法
    this.value = value
    this.dep = new Dep() // 此dep  专门为数组而设定
    // data.__ob__ = this;//给每一个监控过的对象都添加一个__ob__属性 
    //上述方法会导致observeArray循环时枚举到__ob__属性  导致一直循环而栈溢出
    def(value,'__ob__',this)
    if (Array.isArray(value)) {
      //如果是数组的话并不会对索引进行观测 因为会导致性能问题
      //前端开发中很少很少 去操作索引 一般用push shift

      //重写数组中的方法  装饰模式
      value.__proto__ = arrayMethods
      //如果数组里放的是对象
      //当调用数组方法时 手动通知
      this.observeArray(value)
    } else {
      //将用户的数据使用defineProperty重新定义
      this.walk(value);
    }
  }
  observeArray(data){
    data.forEach(item => {
      observe(item)
    })
  }
  walk(obj){
    let keys = Object.keys(obj)
    keys.forEach(key =>{
      defineReactive(obj,key,obj[key])
    })
  }
}

export function defineReactive(obj,key,value) {
  //不支持ie8 及 ie8以下的浏览器
  //递归观察
  let childOb = observe(value) //递归观察只有数组和对象会有返回值  但是不考虑对象 
  let dep = new Dep() // dep里可以收集依赖 收集的是watcher 每个属性一个实例
  Object.defineProperty(obj,key,{
    enumerable:true,
    configurable:true,
    // ** 依赖收集
    get(){
      if (Dep.target) { //这次有值 是渲染watcher
        //希望存入的watcher 不能重复，如果重复会造成更新时多次渲染
        dep.depend(); // 他像dep中可以存watcher 这个watcher中也存放dep 实现一个多对多的关系

        if (childOb) {
          childOb.dep.depend() //数组也进行依赖收集 对象就算也收集已经没有意义了 
          if (Array.isArray(value)) {
            dependArray(value) //收集儿子的依赖              
          }
        }
      }
      return value
    },
    // ** 通知依赖更新
    set(newValue){
      if (newValue === value) return
      value = newValue
      debugger
      childOb = observe(newValue)
      dep.notify()
    }
  })
}

export function set(target, key, val) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 如果插入的数组下标比最大数组下标大  比较取出较大的
    target.length = Math.max(target.length,key)
    //这是是数组触发更新的关键 调用重写过的数组方法
    target.splice(key, 1, val)
    return val
  }
  // 如果对象中存在这个属性而且不是在原型链上的  直接修改就行
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  //取出响应式对象
  const ob = target.__ob__
  // 如果没有响应式对象 说明不用触发视图更新 直接赋值 不用管
  if (!ob) {
    target[key] = val
    return val
  }
  // 到这里说明是给对象添加属性  所以需要进行响应式的拦截
  defineReactive(ob.value, key, val)
  // 这里是关键  手动派发更逊
  ob.dep.notify()
  return val
}

export function observe(value) {
  let isObj = isObject(value)
  // 如果不是对象  或者是一个VNode 直接返回
  if (!isObj || value instanceof VNode) return

  let ob
  // 判断是否有__ob__属性  如果有 直接返回  没有的话 新建一个
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if ((Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && Object.isExtensible(value) && !value._isVue) {
    ob = new Observer(value)
  }
  return ob
}
