export function getCustomIconAttrs(attrs) {
  return typeof attrs === 'string'
    ? {
      [attrs.includes('el-icon-') ? 'class' : 'iconClass']: attrs
    }
    : attrs
}