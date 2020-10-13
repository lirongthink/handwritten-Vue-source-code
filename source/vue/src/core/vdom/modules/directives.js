import { emptyNode } from "../patch";
import { resolveAsset } from "../../utils/options";
import { mergeVNodeHook } from "../helpers/merge-hook";

export default {
  create: updateDirectives,
  update: updateDirectives,
  destory:function unbindDirectives (vnode) {
    updateDirectives(vnode, emptyNode)
  }
}

function updateDirectives (oldVnode, vnode) {
  // 新旧节点都有指令
  if (oldVnode.data.directives || vnode.data.directives) {
    // 更新并传入新旧节点
    _update(oldVnode, vnode)
  }
}

function _update (oldVnode, vnode) {
  // 创建时调用
  const isCreate = oldVnode === emptyNode
  // 销毁时调用
  const isDestroy = vnode === emptyNode
  // 旧的指令
  const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context)
  // 新的指令
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context)

  const dirsWithInsert = []
  const dirsWithPostpatch = []

  let key, oldDir, dir
  for (key in newDirs) {
    oldDir = oldDirs[key]
    dir= newDirs[key]
    // 没有旧的指令
    if (!oldDir) {
      // 新的指令 执行bind钩子
      callHook(dir, 'bind',vnode, oldVnode)
      // 如果指令中有inseted钩子 就添加到dirsWithInsert数组中
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir)
      }
    } else {
      // 存在旧的指令  执行update钩子
      dir.oldValue = oldDir.value
      callHook(dir, 'update', vnode, oldVnode)
      // 如果指令中有compoentUpdated钩子 就添加到dirsWithPostpatch数组中
      if (dir.def && dir.def.compoentUpdated) {
        dirsWithPostpatch.push(dir)
      }
    }
  }
  // 如果dirsWithInsert不为空 即有需要执行的inserted钩子
  if (dirsWithInsert.length) {
    // 创建函数 循环执行dirsWithInsert中的inserted钩子
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
      }
    }
    // 如果是新创建时  将创建的函数混入进insert钩子
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert)
    } else { // 否则直接执行
      callInsert()
    }
  }
  // 如果dirsWithPostpatch不为空 即有需要执行的update钩子
  if (dirsWithPostpatch.length) {
    // 将componentUpdated钩子混入postpatch钩子函数中
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
      }
    })
  }
  // 如果不是新建时 创建unbind钩子解绑旧的指令
  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
      }
    }
  }
}

const emptyModifiers = Object.create(null)

function normalizeDirectives (dirs, vm) {
  const res = Object.create(null)
  // 没有指令直接返回
  if (!dirs) {
    return res
  }
  let i, dir
  // 遍历指令集合
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i]
    // 如果没有修饰符 直接置为空对象
    if (!dir.modifiers) {
      dir.modifiers = emptyModifiers
    }
    res[getRawDirName(dir)] = dir
    dir.def = resolveAsset(vm.$options, 'directives', dir.name)
  }

  return res
}

function getRawDirName(dir) {
  return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}

function callHook(dir, hook, vnode, oldVnode, isDestroy) {
  // 取出指令中指定的钩子函数
  const fn = dir.def && dir.def[hook]
  // 如果有就执行钩子函数
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
    } catch (e) {
      console.log(e)
    }
  }
}
