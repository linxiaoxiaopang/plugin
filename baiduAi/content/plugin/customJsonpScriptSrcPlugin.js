const Template = require('webpack/lib/Template')

class CustomJsonpScriptSrcPlugin {
  apply(compiler) {
    // 使用 `mainTemplate` 来修改 Webpack runtime
    compiler.hooks.compilation.tap('CustomJsonpScriptSrcPlugin', (compilation) => {

      const needChunkOnDemandLoadingCode = chunk => {
        for (const chunkGroup of chunk.groupsIterable) {
          if (chunkGroup.getNumberOfChildren() > 0) return true
        }
        return false
      }


      // 通过 `mainTemplate.hooks.localVars` 修改 Webpack 内部生成的代码
      compilation.hooks.buildModule.tap('CustomJsonpScriptSrcPlugin', (module) => {
        const mainTemplate = compilation.mainTemplate
        const getScriptSrcPath = (hash, chunk, chunkIdExpression) => {
          const chunkFilename = mainTemplate.outputOptions.chunkFilename
          const chunkMaps = chunk.getChunkMaps()
          return mainTemplate.getAssetPath(JSON.stringify(chunkFilename), {
            hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
            hashWithLength: length =>
              `" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
            chunk: {
              id: `" + ${chunkIdExpression} + "`,
              hash: `" + ${JSON.stringify(
                chunkMaps.hash
              )}[${chunkIdExpression}] + "`,
              hashWithLength(length) {
                const shortChunkHashMap = Object.create(null)
                for (const chunkId of Object.keys(chunkMaps.hash)) {
                  if (typeof chunkMaps.hash[chunkId] === "string") {
                    shortChunkHashMap[chunkId] = chunkMaps.hash[chunkId].substr(
                      0,
                      length
                    )
                  }
                }
                return `" + ${JSON.stringify(
                  shortChunkHashMap
                )}[${chunkIdExpression}] + "`
              },
              name: `" + (${JSON.stringify(
                chunkMaps.name
              )}[${chunkIdExpression}]||${chunkIdExpression}) + "`,
              contentHash: {
                javascript: `" + ${JSON.stringify(
                  chunkMaps.contentHash.javascript
                )}[${chunkIdExpression}] + "`
              },
              contentHashWithLength: {
                javascript: length => {
                  const shortContentHashMap = {}
                  const contentHash = chunkMaps.contentHash.javascript
                  for (const chunkId of Object.keys(contentHash)) {
                    if (typeof contentHash[chunkId] === "string") {
                      shortContentHashMap[chunkId] = contentHash[chunkId].substr(
                        0,
                        length
                      )
                    }
                  }
                  return `" + ${JSON.stringify(
                    shortContentHashMap
                  )}[${chunkIdExpression}] + "`
                }
              }
            },
            contentHashType: "javascript"
          })
        }


        // 使用 mainTemplate 的 `localVars` 钩子来修改生成的 JS 代码
        compilation.mainTemplate.hooks.localVars.tap(
          'CustomJsonpScriptSrcPlugin',
          (source, chunk, hash) => {
            const extraCode = []

            // 修改 `jsonpScriptSrc` 路径的生成逻辑
            if (needChunkOnDemandLoadingCode(chunk)) {
              extraCode.push(
                '',
                '// Custom script path function',
                'function jsonpScriptSrc(chunkId) {',
                Template.indent([
                  // 这里可以替换为你自定义的路径
                  `
                  let res = ${compilation.mainTemplate.requireFn}.p + ${getScriptSrcPath(
                    hash,
                    chunk,
                    "chunkId"
                  )}
                  if(chrome&&chrome.runtime) {
                    res = chrome.runtime.getURL(res)
                    import(res)
                  }
                  return res
                  `
                ]),
                '}'
              )
            }

            // 如果没有额外的修改需求，则直接返回原始源代码
            if (extraCode.length === 0) return source

            return Template.asString([source, ...extraCode])
          }
        )
      })
    })
  }
}

module.exports = CustomJsonpScriptSrcPlugin
