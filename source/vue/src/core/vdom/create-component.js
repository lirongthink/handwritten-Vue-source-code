import { isUndef } from "../../shared/util";
import { isObject } from "util";
import VNode from "./vnode";
import { callHook } from "../instance/lifecycle";

const componentVNodeHooks = {
  init(vnode){
    const child = vnode.componentInstance = createComponentInstanceForVnode(vnode)
    //手动调用mount
    child.$mount(undefined)
  },
  insert(vnode){
    const { context, componentInstance } = vnode
    //如果子组件没有挂载  则调用mounted钩子函数
    if (!componentInstance._isMounted ) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
  },
  // prepatch(oldVnode, vnode){
  //   // 取出组件配置
  //   const options = vnode.componentOptions
  //   // 取出老节点实例
  //   const child = vnode.componentInstance = oldVnode.componentInstance
  //   updateChildComponent()
  // },
  // destroy () {
  //   const { componentInstance } = vnode
  //   if (!componentInstance._isDestroyed) {
  //     if (!vnode.data.keepAlive) {
  //       componentInstance.$destroy()
  //     } else {
  //       deactivateChildComponent(componentInstance, true /* direct */)
  //     }
  //   }
  // }
  
}

const hooksToMerge = Object.keys(componentVNodeHooks)

export function createComponent(Ctor, data, context, children, tag) {
  // 如果
  if (isUndef(Cotr)) {
    return 
  }

  //取出Vue实例
  const baseCtor = context.$options._base

  //如果传入的是对象,则转换成一个组件的构造器
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }

  data = data || {}

  // 这里存储一下组件的自定义事件
  const listeners = data.on

  // 将组件的原生DOM事件进行配置
  data.on = data.nativeOn
  //安装组件的钩子
  installComponentHooks(data)

  const name = Ctor.options.name || tag
  //创建VNode
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data,undefined, undefined, undefined, context,
    { Ctor, listeners, tag, children }
  )
  return vnode
}

function installComponentHooks(data) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}

function mergeHook(f1, f2) {
  // 挨个执行钩子函数
  const merged = (a, b) => {
    f1(a, b)
    f2(a, b)
  }
  merged._merged = true
  return merged
}

export function createComponentInstanceForVnode(vnode, parent) {
  
  const options = {
    _isComponent:true,
    _parentVnode:vnode,
    parent
  }
  // 调用该组件通过extend生成的构造器
  return new vnode.componentOptions.Cotr(options)
}
