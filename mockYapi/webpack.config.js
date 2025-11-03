const path = require('path')

module.exports = {
  entry: './background/main.js',
  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, './background/dist'),
  },
  module: {
    rules: [
      {
        // 匹配 mockjs 的源码文件
        test: /.*node_modules(\/|\\)+mockjs.+dist(\/|\\)mock\.js$/,
        use: [
          // 使用自定义 loader 替换 eval 代码
          path.resolve(__dirname, './background/loader/replaceMockEvalLoader.js')
        ]
      },
      {
        test: /\.js$/,  // 对所有 .js 文件进行处理
        exclude: /node_modules/,  // 排除 node_modules 文件夹
        use: {
          loader: 'babel-loader'  // 使用 babel-loader 进行转译
        }
      }
    ]
  }
}
