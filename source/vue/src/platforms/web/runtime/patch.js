
import * as nodeOps from './node-ops'
import { createPatchFunction } from '../../../core/vdom/patch';
import baseModules from '../../../core/vdom/modules/index'
import platformModules from './modules/index'

// 合并modules
const modules = platformModules.concat(baseModules)

export const patch = createPatchFunction({ modules, nodeOps })
