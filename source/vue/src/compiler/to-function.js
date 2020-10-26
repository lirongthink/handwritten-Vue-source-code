
function createFunction (code) {
  try {
    return new Function(code)
  } catch (err) {
    console.log(err)
    return function(){}
  }
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
