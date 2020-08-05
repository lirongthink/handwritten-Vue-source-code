import { initState } from "./state";
import Watcher from "./observe/watcher";
import { query, compiler } from "./utils";
export function initMixin(Vue) {
  Vue.prototype._init = function(options) {
    let vm = this;//当前实例
    vm.$options = options;

    // MVVM原理 需要将数据重新初始化
    //拦截数组的方法 和 对象的属性
    initState(vm);

    //初始化工作
    if (vm.$options.el) {
      vm.$mount()
    }

  }

  Vue.prototype._update = function () {
    //用户传入的数据 去更新视图
    let vm = this
    let el = vm.$el

    // 要循环传入这个元素 将里面的内容 换成我们的数据
    let node = document.createDocumentFragment();

    let firstChild
    while (firstChild = el.firstChild) { // 每次拿到第一个元素就将这个元素放入到文档碎片中
      node.appendChild(firstChild) // appendChild 是具有移动的功能
    }
    //对文本进行替换
    compiler(node,vm)
    el.appendChild(node)
  }

  //渲染页面 将组件进行挂载
  Vue.prototype.$mount = function () {
    let vm = this
    let el = vm.$options.el // 获取元素

    el = vm.$el = query(el) // 获取当前挂载的节点 vm.$el就是要挂载的元素
    // 渲染时通过 watcher来渲染的  用来监控变化  数据一发生改变就重新渲染
    // 渲染watcher 用于渲染的watcher
    // vue2.0 组件级别更新   new Vue 产生了一个组件
    let updateComponent = () =>{ // 更新组件   渲染组件
      vm._update();//更新组件
    }
    new Watcher(vm,updateComponent) //渲染watcher 默认会调用updateComponent方法

    //如果数据更新了
    //我需要让每个数据  它更改了  需要重新的渲染
  }
  Vue.prototype.$watch = function (expr,handler,opts) {
    //原理也是创建一个watcher
    let vm = this
    new Watcher(vm,expr,handler,{ user:true,...opts }) // 表示用户自己定义的watch
  }
}
