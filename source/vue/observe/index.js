import { isObject, def } from "../utils";
import { arrayMethods, dependArray } from "./array";
import Dep from "./dep";

class Observer {
  constructor(data){
    //vue 如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法

    this.dep = new Dep() // 此dep  专门为数组而设定
    // data.__ob__ = this;//给每一个监控过的对象都添加一个__ob__属性 
    //上述方法会导致observeArray循环时枚举到__ob__属性  导致一直循环而栈溢出
    def(data,'__ob__',this)
    if (Array.isArray(data)) {
      //如果是数组的话并不会对索引进行观测 因为会导致性能问题
      //前端开发中很少很少 去操作索引 一般用push shift

      //重写数组中的方法  装饰模式
      data.__proto__ = arrayMethods
      //如果数组里放的是对象
      //当调用数组方法时 手动通知
      this.observeArray(data)
    } else {
      //将用户的数据使用defineProperty重新定义
      this.walk(data);
    }
  }
  observeArray(data){
    data.forEach(item => {
      observe(item)
    })
  }
  walk(data){
    let keys = Object.keys(data)
    keys.forEach(key =>{
      defineReactive(data,key,data[key])
    })
  }
}

export function defineReactive(data,key,value) {
  //不支持ie8 及 ie8以下的浏览器
  //递归观察
  let childOb = observe(value) //递归观察只有数组和对象会有返回值  但是不考虑对象 
  let dep = new Dep() // dep里可以收集依赖 收集的是watcher 每个属性一个实例
  Object.defineProperty(data,key,{
    // ** 依赖收集
    get(){
      console.log(value,'取值')
      if (Dep.target) { //这次有值 是渲染watcher
        //希望存入的watcher 不能重复，如果重复会造成更新时多次渲染
        dep.depend(); // 他像dep中可以存watcher 这个watcher中也存放dep 实现一个多对多的关系

        if (childOb) {
            childOb.dep.depend() //数组也进行依赖收集 对象就算也收集已经没有意义了 
            dependArray(value) //收集儿子的依赖
        }
      }
      return value
    },
    // ** 通知依赖更新
    set(newValue){
      if (newValue === value) return
      value = newValue
      dep.notify()
    }
  })
}

export function observe(data) {
  let isObj = isObject(data)
  if (!isObj)return
  return new Observer(data)
}
