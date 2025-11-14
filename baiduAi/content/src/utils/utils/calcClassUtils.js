import { getRectPosByAngle, getUUID } from '@/utils'
import { filter, isPlainObject, isString, isFunction } from 'lodash'
import { DESIGN_SHOW_AREA_H, DESIGN_SHOW_AREA_W } from '@/utils/constant'


export function loadFromJSONAfter(canvas, json) {
  return new Promise(resolve => {
    canvas.loadFromJSON(json, resolve)
  })
}

export function getAfterRotateSize(activeObject, angle, originPoint) {
  const fillProps = {
    left: 0,
    top: 0,
    scaleX: 1,
    scaleY: 1
  }
  Object.entries(fillProps).map(([prop, val]) => {
    activeObject[prop] || (activeObject[prop] = val)
  })
  const { min, max } = Math
  const posList = getRectPosByAngle(activeObject, angle, originPoint)
  const xMap = posList.map(({ x }) => x)
  const yMap = posList.map(({ y }) => y)
  const naturalWidth = max(...xMap) - min(...xMap)
  const naturalHeight = max(...yMap) - min(...yMap)
  return {
    naturalWidth,
    naturalHeight
  }
}

/**
 * 删除跟激活图层一样的组层
 * @param canvas
 * @param objects
 * @param curLayer
 */
export function delGroupList(canvas, objects, curLayer) {
  const sameLayers = filter(objects, { id: getGroupId(curLayer) })
  if (!sameLayers.length) return
  sameLayers.map(layer => {
    delGroupLayer(layer, canvas, false)
  })
  canvas.renderAll()
}

export function getGroupId(curLayer) {
  return `${curLayer.id}Group`
}

export function delGroupLayer(layer, canvas, isRender = true) {
  if (!layer) return
  if (layer.type !== 'group') return
  canvas.remove(layer)
  isRender && canvas.renderAll()
}

export function transformPassProps(props, data, option = {}) {
  return Object.keys(props).reduce((cur, prev) => {
    let value = props[prev]
    if (isPlainObject(value)) {
      if (value.prop) {
        prev = value.prop
      }
      if (!value.value) {
        value = prev
      }
      if (isPlainObject(value)) {
        value = value.value
      }
    }
    if (isFunction(value)) {
      cur[prev] = value(data, option)
    } else {
      cur[value] = data[prev]
    }
    return cur
  }, {})
}

export function isTextLayer(type) {
  if (!type) return false
  if (!isString(type)) type = type.type
  if (type == 'i-text' || type == 'text' || type == 'fixedTextBox') return true
  return false
}

export function isToDesignLayer(id) {
  if (!id) return false
  if (!isString(id)) id = id.id
  return (id + '').includes('@')
}

//创建一个画布
export function createFabricCanvas(width, height) {
  width = width || DESIGN_SHOW_AREA_W
  height = height || DESIGN_SHOW_AREA_H
  const canvas = new fabric.Canvas(getUUID() + '', {
    preserveObjectStacking: true,
    width,
    height
  })
  return canvas
}
