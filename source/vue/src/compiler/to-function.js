
function createFunction (code) {
  return new Function(code)
}

export function createCompileToFunctionFn (compile) {
  return function compileToFunctions(template, options) {
    // 解析出render函数
    const compiled = compile(template, options)
    const res = {}
    //将字符串转换成函数
    res.render = createFunction(compiled.render)
    res.staticRenderFns = compiled.staticRenderFns.map(code => {
      return createFunction(code)
    })

    return res
  }
}
