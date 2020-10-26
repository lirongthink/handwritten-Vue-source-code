import { nextTick } from "../utils/next-tick";
import { callHook } from "../instance/lifecycle";

const activatedChildren = []

let has = {}
let queue = []
//当前执行到的watcher的索引
let index = 0
//一些控制函数执行的标志位
let waiting = false
let flushing = false


function resetSchedulerState() {
  index = queue.length = 0
  has = {}
  waiting = flushing = false
}

function flushSchedulerQueue() {
  flushing =  true
  let watcher,id
  // 排序 保证是先父后子的更新
  queue.sort((a,b) => a.id - b.id)
  // 等待当前这一轮全部更新后 再去让watcher 依次执行
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    // 渲染watcher 会有一个before函数 调用执行一个beforeUpdate钩子
    if (watcher.before) {
      watcher.before()
    }
    id = watcher[id]
    has[id] = null
    //调用watcher的run函数
    watcher.run()
  }
  // 复制队列副本
  // keep-alive组件的队列
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()
  //重置这些状态参数
  resetSchedulerState()

  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)
}

function callActivatedHooks (queue) {
  // 循环队列调用activateChildComponent函数
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true)
  }
}

function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    // 已经挂载 且没有销毁 链接无错误 调用updated钩子
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

export function queueActivatedComponent (vm) {
  vm._inactive = false
  // 将组件插入队列
  activatedChildren.push(vm)
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}


export function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

export function queueWatcher(watcher) { //对重复的watcher进行过滤操作
  let id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher) // 相同watcher只会存一个到queue中      
    } else { // 如果flushSchedulerQueue已经开始执行 此时又有watcher加入进来
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }

      queue.splice(i + 1, 0, watcher)
    }
    if (!waiting) {
      waiting = true
      // 延迟清空队列
      nextTick(flushSchedulerQueue)
    }
  }
}
