require('dotenv').config({ path: `.env.${process.env.ENV_STAGE}` })
const path = require('path')
const ENV = process.env.NODE_ENV
const version = new Date().getTime()
const CustomJsonpScriptSrcPlugin = require('./plugin/customJsonpScriptSrcPlugin')

/* eslint-disable */
const CONFIG = {
  TITLE: '百度AI插件'
}

/* eslint-enable */

function resolve(dir) {
  return path.join(__dirname, '.', dir)
}

const themeDesignContainerPath = path.join('views', 'components', 'themeDesignContainer')
module.exports = {
  lintOnSave: process.env.NODE_ENV === 'development',
  publicPath: 'content/dist',
  outputDir: 'dist',
  productionSourceMap: false,


  configureWebpack: (config) => {
    config.devtool = false
    //生产环境去除log
    if (ENV === 'production') {
      config.output.filename = 'js/[name].[chunkhash:8].' + version + '.js'
      config.output.chunkFilename = 'js/[name].[chunkhash:8].' + version + '.js'
      const compress = config.optimization.minimizer[0].options.terserOptions.compress
      compress.warnings = false
      compress.drop_console = true
      compress.drop_debugger = true
      compress.pure_funcs = ['console.log']
    }


    return {
      resolve: {
        alias: {
          '~': '@/views/components'
        }
      }
    }
  },
  devServer: {
    writeToDisk: (filePath) => {
      if (filePath.includes('.hot-update.')) {
        return false // 不写入磁盘
      }
      return true
    }
  },

  chainWebpack: (config) => {
    config.module.rule('svg').exclude.add(resolve('src/icons')).end()

    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
    //在js中刪除worker的编译，触发热更新
    config.module.rule('js').exclude.add(/\.worker\.js$/)
    //worker-loder
    config.module
      .rule('worker')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
      .options({
        filename: '[name].[contenthash].worker.js'
      })

    // config
    //   .when(ENV === 'production', config => {
    //     config.plugin('webpackOptimize').use(webpack.optimize.LimitChunkCountPlugin, [{
    //       maxChunks: 10,
    //       minChunkSize: 50000
    //     }])
    //   })

    config.plugin('html').tap((args) => {
      args[0].title = CONFIG.TITLE
      return args
    })

    config.plugin('custom-jsonp-script-src')
      .use(CustomJsonpScriptSrcPlugin)
  },
  css: {
    loaderOptions: {
      // 给 sass-loader 传递选项
      sass: {
        // @/ 是 src/ 的别名
        // 所以这里假设你有 `src/variables.scss` 这个文件
        // additionalData: `
        //     @import "~@/styles/variables.scss";
        //     @import "~@/styles/mixin.scss";
        // `
        additionalData(content, loaderContext) {
          const { resourcePath } = loaderContext
          const sourceDirname = path.dirname(resourcePath)
          let additionalData = `
            @import "~@/styles/variables.scss";
            @import "~@/styles/mixin.scss";
          `
          if (sourceDirname.indexOf(themeDesignContainerPath) >= 0 && resourcePath.indexOf('themeVariableScss.scss') === -1) {
            additionalData = `
              ${additionalData}
            `
          }
          return `
             ${additionalData}
             ${content}
          `
        }
      }
    }
  }
}
