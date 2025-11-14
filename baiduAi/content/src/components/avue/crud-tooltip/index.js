import CrudTooltip from '../crud/src/crud-tooltip'

/* istanbul ignore next */
CrudTooltip.install = function (Vue) {
  Vue.component(CrudTooltip.name, CrudTooltip)
}

export default CrudTooltip
