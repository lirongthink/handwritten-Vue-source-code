import { parse } from "./parser";
import { optimize } from "./optimizer";
import { generate } from "./codegen";
import { createCompileToFunctionFn } from "./to-function";

function baseCompile(template, options) {
  //将传入的模板字符串解析成AST
  const ast = parse(template.trim(), options)
  // // 判断 选项中是否传入optimize
  // if (options.optimize !== false) {
    //对节点进行静态标记
    optimize(ast, options)
  // }
  // 将ast解析成渲染函数
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
}

export function createCompiler(baseOptions) {
  function compile (template, options){
    const finalOptions = Object.create(baseOptions)

    if (options) {
      // 合并modules
      if (options.modules) {
        finalOptions.modules =
          (baseOptions.modules || []).concat(options.modules)
      }
      // 合并指令
      if (options.directives) {
        finalOptions.directives = extend(
          Object.create(baseOptions.directives || null),
          options.directives
        )
      }
      // 复制其他的选项到总的选项中
      for (const key in options) {
        if (key !== 'modules' && key !== 'directives') {
          finalOptions[key] = options[key]
        }
      }
    }
    const compiled = baseCompile(template.trim(), finalOptions)
    return compiled
  }

  return {
    compile,
    compileToFunctions: createCompileToFunctionFn(compile)
  }
}
