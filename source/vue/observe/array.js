

//重写数组中的 会导致数组本身发生变化的方法 7个 push shift unshift pop reverse sort splice 

let oldArrayMethods = Array.prototype;

export function dependArray(value) { // 递归收集数组中的依赖
  value.forEach(currentItem =>{
    //也有可能是一个数组
    currentItem.__ob__ && currentItem.__ob__.dep.depend()
    if (Array.isArray(currentItem)) {
      dependArray(currentItem) // 不停的收集数组中的依赖
    }
  })
}

// arrayMethods.__proto__ = oldArrayMethods
export let arrayMethods = Object.create(oldArrayMethods)

const methods = [
  'push',
  'shift',
  'unshift',
  'pop',
  'reverse',
  'sort',
  'splice'
]
methods.forEach(method =>{
  arrayMethods[method] = function (...args) {
      const result = oldArrayMethods[method].apply(this,args) //调用原生的数组方法
      // push unshift 添加的元素可能还是一个对象
      let ob = this.__ob__
      let inserted; // 当前用户插入的元素
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice': //第3个参数  新增的属性 splice
          inserted = args.slice(2)
        default:
          break;
      }
      if (inserted) ob.observeArray(inserted) //将新增属性继续监控
      ob.dep.notify()
      return result
  }
})
