import get from 'lodash/get'
import path from 'path'
import { packageName, urlPrefix } from '../constants'
import { v4 as uuidv4 } from 'uuid'

const _ = {
  get,
}

/**
 *
 *
 * @export
 * @param {Object} - config
 * @param {Object} - webpackAssets
 * @params {string} - env
 * @returns {string} - html string
 */
export function buildEmbeddedCode(config, webpackAssets, env = 'production') {
  const uniqueId = `${packageName}-${uuidv4()}`
  const data = _.get(config, 'data')
  const stringifyData =
    Array.isArray(data) && data.length > 0
      ? data.reduce((acc, cur, index) => {
          if (index === 0) {
            return `["${cur}"`
          }
          if (index === data.length - 1) {
            return `${acc}, "${cur}"]`
          }
          return `${acc}, "${cur}"`
        }, '')
      : '[]'

  const lazyload = _.get(config, 'lazyload', false)

  const loadDataScript = `
    <script>
      (function() {
        var namespace = '__twreporterEmbeddedData'
        var packageName = '${packageName}'
        if (!window[namespace]) { window[namespace] = {} }
        if (!window[namespace][packageName]) { window[namespace][packageName] = {} }
        window[namespace][packageName]["${uniqueId}"] = {
          data: ${stringifyData},
          ${lazyload && 'lazyload: true'}
        }
      })()
    </script>`

  const contentMarkup = `<div id="${uniqueId}" data-status="tbRendered"></div>`

  const { chunks, bundles } = webpackAssets[packageName]
  const assets = [...chunks, ...bundles]
  const pathToDist =
    env === 'production'
      ? urlPrefix
      : path.resolve(__dirname, '../../../../dist')
  const assetScript = assets
    .map(src => {
      if (src.endsWith('bundle.js')) {
        if (src.indexOf(`${packageName}`) !== -1) {
          return `<script type="text/javascript" data-id="${uniqueId}" data-name="${packageName}" src="${pathToDist}/${src}"></script>`
        }
        return
      }
      return `<script type="text/javascript" src="${pathToDist}/${src}"></script>`
    })
    .join('')

  return contentMarkup + loadDataScript + assetScript
}
