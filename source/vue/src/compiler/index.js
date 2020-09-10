import { parse } from "./parser";
import { optimize } from "./optimizer";
import { generate } from "./codegen";

export function baseCompile(template, options) {
  //将传入的模板字符串解析成AST
  const ast = parse(template.trim(), options)
  // 判断 选项中是否传入optimize
  if (options.optimize !== false) {
    //对节点进行静态标记
    optimize(ast, options)
  }
  // 将ast解析成渲染函数
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
}
