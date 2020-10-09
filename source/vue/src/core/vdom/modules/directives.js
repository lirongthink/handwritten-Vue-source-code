import { emptyNode } from "../patch";
import { resolveAsset } from "../../utils/options";
import { mergeVNodeHook } from "../helpers/merge-hook";

export default {

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
      // 新的指令 用bind
      callHook(dir, 'bind',vnode, oldVnode)
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir)
      }
    } else {
      // 存在指令 用update
      dir.oldValue = oldDir.value
      callHook(dir, 'update', vnode, oldVnode)
      if (dir.def && dir.def.compoentUpdated) {
        dirsWithPostpatch.push(dir)
      }
    }
  }

  if (dirsWithInsert.length) {
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
      }
    }
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert)
    } else {
      callInsert()
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
      }
    })
  }

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
  const fn = dir.def && dir.def[hook]
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
    } catch (e) {
      console.log(e)
    }
  }
}
