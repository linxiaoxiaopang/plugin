<template>
  <div class="v-tabs" :class="{ [`v-tabs--${finalOption.type}`]: finalOption.type }">
    <component
      :is="tabsName"
      v-model="curValue"
      :option="tabsOption"
      :props="props"
      :showAllLevels="false"
      @tab-click="handleTabClick"
      :checkList.sync="curCheckList"
      @checkbox-change="handleCheckboxChange"
      v-bind="tabsOption"
    />

    <VTabs
      v-if="children"
      :key="curValue"
      v-model="childValue"
      :option="children"
      :props="props"
      @change="handleChange"
      @tab-click="handleTabClick"
      :checkList.sync="childCheckList"
      @checkbox-change="handleCheckboxChange"
    ></VTabs>

    <slot name="center"></slot>

    <div v-if="hasContent" class="v-tabs__content">
      <keepExist
        v-for="(item) in contentColumn"
        :key="item.value"
        :prop="item.value"
        :active="contentValue"
        :isWrapper="false"
        :lazy="isLazy"
      >
        <slot :name="item.value" :column="item">
          <slot :column="item">
            <component v-if="item.name" :is="item.name" :column="item.column" v-bind="item.attrs"></component>
          </slot>
        </slot>
      </keepExist>
    </div>
  </div>
</template>

<script>
import avueTabs from './avueTabs'
import keepExist from '@/components/keepExist'
import recursiveMixin from '@/mixins/option/recursiveMixin'
import { validData } from '@/components/avue/utils/util'
import { validatenull } from '@/components/avue/utils/validate'
import { getTabsOption } from '@/components/base/baseTabs/util'
import { uniqBy } from 'lodash'

export default {
  name: 'VTabs',
  components: {
    avueTabs,
    keepExist
  },
  mixins: [recursiveMixin],
  props: {
    lazy: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      curCheckList: [],
      childCheckList: []
    }
  },
  computed: {
    tabsOption({ finalOption }) {
      const option = { ...finalOption }
      switch (option.type) {
        case 'plainButton':
          option.type = 'card'
          break
      }
      return option
    },
    tabsName() {
      return validData(this.finalOption.tabsName, 'avueTabs')
    },
    isLazy() {
      return validData(this.lazy, this.finalOption.lazy)
    },

    contentValue() {
      const column = this.columnOption[this.lastValue] || {}
      return column.contentValue || column[this.dictValue]
    },
    contentColumn({ dictValue }) {
      return uniqBy(getContentColumn(this.finalOption.column), 'value')

      function getContentColumn(column, result = []) {
        for (const ele of column) {
          if (!validatenull(ele.children)) {
            const { column: childrenColumn } = getTabsOption(ele.children)
            getContentColumn(childrenColumn, result)
            continue
          }
          result.push({
            ...ele,
            column: ele,
            value: ele.contentValue || ele[dictValue]
          })
        }
        return result
      }
    },
    hasContent({ contentColumn, $scopedSlots }) {
      let hasContent = !!$scopedSlots.default
      contentColumn.forEach(item => {
        if (item.name || $scopedSlots[item.value]) hasContent = true
      })
      return hasContent
    }
  },
  methods: {
    handleTabClick() {
      // console.log(this.curValue, 'handleTabClick')
      let { finalValue } = this

      // 如果有children，就由子组件触发change
      validatenull(this.children) && this.handleChange(finalValue)

      this.$emit('tab-click', finalValue)
    },

    handleCheckboxChange() {
      const checkList = this.curCheckList.concat(this.childCheckList)
      this.$emit('update:tabsCheckList', checkList)
      this.$emit('checkbox-change', checkList)
    }
  }
}
</script>

<style lang="scss" scoped>
.v-tabs {
  &::v-deep {
    > .v-tabs {
      margin-top: 10px;
    }
    > *:first-child {
      .el-tabs__header {
        border-bottom: none;
        .el-tabs__item {
          border-bottom-color: $border-color;
        }
      }
    }
  }
}

.v-tabs__content {
  margin-top: 10px;
}

.flex-scroll {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .v-tabs__content {
    overflow: auto;
  }
}
</style>