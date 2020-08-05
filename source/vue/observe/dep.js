let id = 0;
class Dep{ //发布订阅模式
  constructor(){
    this.id = id++
    this.subs = []
  }
  addSub(watcher){ // 订阅 就是将调用addSub时传入的内容保存到数组中
    this.subs.push(watcher)
  }
  notify(){ // 发布
    this.subs.forEach(watcher => watcher.update())
  }
  depend(){
    if(Dep.target){
      //Dep.target是一个渲染watcher
      Dep.target.addDep(this) // 希望可以在watcher中互相记忆
    }
  }
}
let stack = []
//用来保存当前的watcher
export function pushTarget(watcher) {
  Dep.target = watcher
  stack.push(watcher)
}
export function popTarget(params) {
  stack.pop()
  Dep.target = stack[stack.length - 1]
}
export default Dep; // 用来收集依赖 收集的时一个个watcher
