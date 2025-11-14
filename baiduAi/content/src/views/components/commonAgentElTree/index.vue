<template>
  <div class="common-agent-el-tree-component" :class="`common-agent-el-tree-component--${theme}`">
    <div class="title" v-if="title">
      {{ title }}
    </div>
    <el-tree
      ref="tree"
      :data="data"
      :defaultExpandedKeys="defaultExpandedKeys"
      v-bind="allProps"
      v-on="$listeners"
    ></el-tree>
  </div>
</template>

<script>

import { validatenull } from '@/components/avue/utils/validate'
import { flatTreeMapDeep } from '@/utils';
import { validData } from '@/components/avue/utils/util';

const DEFAULT_PROPS = {
  'node-key': 'id',
  'default-checked-keys': ['all'],
  indent: 25,
  props: {
    children: 'children',
    label: 'label'
  }
}

export default {
  props: {
    title: String,

    theme: {
      type: String,
      default: 'default'
    },

    data: {
      type: Array,
      required: true
    },

    model: {
      type: String,
      default: 'id'
    },

    treeSearch: {
      type: Object,
      required: true
    },

    tabActiveName: String
  },

  computed: {
    allProps({ $attrs }) {
      return Object.assign({}, DEFAULT_PROPS, $attrs)
    },

    flatData({ data }) {
      return flatTreeMapDeep(data)
    },

    defaultExpandedKeys({ treeSearch, model }) {
      return [validData(treeSearch[model], 'all')]
    }
  },

  watch: {
    tabActiveName() {
      this.setFirstKey()
    }
  },

  mounted() {
    this.watchData()
  },

  methods: {
    watchData() {
      let unWatch
      unWatch = this.$watch('data', (newVal) => {
        if (validatenull(newVal)) return
        this.setFirstKey()
        unWatch && unWatch()
      }, {
        immediate: true
      })
      this.$once('hook:destroyed', () => {
        unWatch && unWatch()
      })
    },

    setFirstKey() {
      if (validatenull(this.data)) return
      console.log('this.data', this.data)
      const nodeKey = this.allProps['node-key']
      const model = $GET(this.treeSearch, this.model, '')
      let nodeIndex = 0
      if (model) {
        const fIndex = this.flatData.findIndex(item => item[nodeKey] == model)
        if (fIndex >= 0) nodeIndex = fIndex
      }
      const currentKey = $GET(this.flatData, `${nodeIndex}.${nodeKey}`)
      this.setCurrentKey(currentKey)
      this.$set(this.treeSearch, this.model, currentKey)
      this.$emit('set-first-key', currentKey)
    },

    setCurrentKey(key) {
      const { tree } = this.$refs
      if (!tree) return
      tree.setCurrentKey(key)
    }
  }
}
</script>

<style lang="scss" scoped>
.title {
  padding: 10px;
}

::v-deep {
  .el-tree-node__expand-icon {
    color: $color-content;
    font-size: $text-mini;
  }

  .el-tree-node__expand-icon.is-leaf::before {
    visibility: hidden;
  }

  .el-tree-node__content {
    color: $color-content;
    margin-bottom: 4px;
    //padding-left: 16px !important;
  }

  .el-tree-node__content::before {
    content: '';
    margin-left: 25px;
  }
}

.common-agent-el-tree-component--dark {
  ::v-deep {
    .el-tree-node.is-current > .el-tree-node__content {
      background: $color-background--extensive;
    }
  }
}
</style>
