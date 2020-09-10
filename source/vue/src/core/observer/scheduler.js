import { nextTick } from "../utils/next-tick";

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

  //重置这些状态参数
  resetSchedulerState()
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
