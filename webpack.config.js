const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  entry:'./src/index.js', //以src的index.js为入口进行打包
  output:{
    filename:'bundle.js',
    path:path.resolve(__dirname,'dist')
  },
  devtool:'source-map', //可以检测源码（webpack会把源码转为js）  易于代码调试
  resolve:{ //更改解析模块的查找方式
    modules:[path.resolve(__dirname,'source'),path.resolve(__dirname,'node_modules')]
  },
  plugins:[
    new HtmlWebpackPlugin({
      template:path.resolve(__dirname,'public/index.html')
    })
  ]
}
