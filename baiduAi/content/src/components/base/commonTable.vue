<template>
  <el-table
    ref="table"
    :data="infoData"
    :class="['commonTableComponent', size === 'mini' && 'minicommonTableComponent']"
    v-loading="tableLoading"
    :tooltip-effect="$attrs['tooltip-effect'] || 'dark'"
    :span-method="spanMethod"
    :style="{
      width: $attrs.width || '100%',
      'max-height': $attrs['max-height'] || 'auto',
      'min-height': $attrs['min-height'] || 'auto'
    }"
    :border="$attrs.border === undefined ? true : $attrs.border"
    :cell-class-name="handleCellClassName"
    v-bind="
      Object.assign(
        height === 'auto'
          ? {}
          : {
              height: height ? height : 'calc(100vh - 240px)'
            },
        $attrs
      )
    "
    v-on="$listeners"
  >
    <template slot="empty">
      <slot name="empty">
        {{ $attrs['empty-text'] || '暂无数据' }}
      </slot>
    </template>
    <el-table-column v-if="selection" type="selection" prop="selection" :selectable="selectable" width="55"></el-table-column>

    <template
      v-for="(
        {
          prop,
          label,
          width,
          minWidth,
          align,
          fixed,
          headerSlotName,
          slotName,
          isSex,
          isPic,
          detailArr,
          children,
          required,
          sortable,
          formatter
        },
        index
      ) in cols"
    >
      <el-table-column
        v-if="children"
        :prop="prop"
        :label="label"
        :key="index"
        :width="width"
        :align="align"
        :min-width="minWidth"
        :sortable="sortable"
      >
        <template v-for="item in children">
          <el-table-column
            :prop="item.prop"
            :label="item.label"
            :width="item.width"
            :min-width="item.minWidth"
            :sortable="sortable"
          >
            <template slot-scope="{ row, $index }">
              <slot :name="item.prop" :scoped="{ ...row, prop: item.prop, index: $index }" :row="row">
                <span>{{ row[item.prop] }}</span>
              </slot>
            </template>
          </el-table-column>
        </template>
      </el-table-column>
      <el-table-column
        v-else-if="isPic"
        :prop="prop"
        :label="label"
        :key="index"
        :width="width"
        :min-width="minWidth"
        sortable
      >
        <template slot-scope="{ row }">
          <!-- <el-tooltip
            class="item"
            effect="dark"
            content="点击可以查看原图"
            placement="right"
          > -->
          <template v-if="Array.isArray(row[prop])">
            <el-image
              style="width: 60px; height: 60px"
              fit="contain"
              lazy
              :scroll-container="height === 'auto' ? undefined : '.el-table__body-wrapper'"
              :src="row[prop][0].path | formatUrl('min')"
              :preview-src-list="row[prop] | prvFormatUrl"
            />
          </template>
          <el-image
            style="width: 60px; height: 60px"
            fit="contain"
            lazy
            :scroll-container="height === 'auto' ? undefined : '.el-table__body-wrapper'"
            v-else
            :src="row[prop] | formatUrl('min')"
            :preview-src-list="row[prop] | prvFormatUrl"
          />
          <!-- </el-tooltip> -->
        </template>
      </el-table-column>

      <el-table-column
        v-else-if="detailArr"
        show-overflow-tooltip
        :prop="prop"
        :label="label"
        :key="index"
        :width="width"
        :min-width="minWidth"
        :sortable="sortable"
      >
        <template slot-scope="{ row }">
          <span>{{ detailArr[row[row.prop]] }}</span>
        </template>
      </el-table-column>

      <template v-else-if="(headerSlotName || required) && slotName">
        <!-- 既自定义头部插槽 和 又自定义col插槽  -->
        <el-table-column
          :prop="prop"
          :key="index"
          :label="label"
          :width="width"
          :min-width="minWidth"
          :sortable="sortable"
        >
          <template slot="header" slot-scope="{ row }">
            <template v-if="required"> <span class="required">*</span> {{ label }} </template>
            <slot :name="headerSlotName" :scoped="{ ...row, prop }" :row="row"></slot>
          </template>
          <template slot-scope="{ row, $index }">
            <slot :name="slotName" :scoped="{ ...row, prop, index: $index }" :row="row"></slot>
          </template>
        </el-table-column>
      </template>
      <!-- 自定义col插槽 -->
      <el-table-column
        v-else-if="slotName === 'dicSlot'"
        :prop="prop"
        :label="label"
        :key="index"
        :width="width"
        :min-width="minWidth"
        :sortable="sortable"
      >
        <template slot-scope="{ row, $index }">
          {{ getLabel(prop, row[prop]) }}
        </template>
      </el-table-column>
      <!-- 自定义col插槽 -->
      <el-table-column
        v-else-if="slotName"
        :prop="prop"
        :label="label"
        :key="index"
        :width="width"
        :min-width="minWidth"
        :sortable="sortable"
      >
        <template slot-scope="{ row, $index }">
          <slot :name="slotName" :scoped="{ ...row, prop, index: $index }" :row="row"></slot>
        </template>
      </el-table-column>

      <!-- 自定义头部插槽 -->
      <el-table-column
        v-else-if="headerSlotName || required"
        :prop="prop"
        :label="label"
        :key="index"
        :width="width"
        :min-width="minWidth"
        :sortable="sortable"
      >
        <template slot="header" slot-scope="{ row }">
          <span class="required" v-if="required">*</span> {{ label }}
          <slot :name="headerSlotName" :scoped="{ ...row, prop }" :row="row"></slot>
        </template>
      </el-table-column>

      <el-table-column
        v-else-if="isSex"
        :prop="prop"
        :label="label"
        :key="index"
        min-width="100px"
        :sortable="sortable"
      >
        <template slot-scope="{ row }">
          <el-tag type="danger" v-if="row[prop] == 0">未知</el-tag>
          <el-tag type="success" v-else-if="row[prop] == 1">男</el-tag>
          <el-tag type="warning" v-else-if="row[prop] == 2">女</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        v-else
        show-overflow-tooltip
        :prop="prop"
        :label="label"
        :width="width"
        :minWidth="minWidth"
        :key="index"
        :fixed="fixed"
        :sortable="sortable"
        :formatter="formatter"
      />
    </template>
    <slot></slot>
  </el-table>
</template>

<script>
import { getLabel } from '@/components/avue/utils/util'

export default {
  props: {
    selection: {
      type: Boolean,
      default: true
    },
    selectable: {
      type: Function,
      default: () => true
    },
    infoData: {
      type: Array,
      default: () => []
    },
    height: String,
    cols: {
      type: Array,
      default: () => []
    },
    tableLoading: {
      type: Boolean,
      default: false
    },
    size: {
      type: String
    },
    spanMethod: {
      type: Function
    },
    cellClassName: Function | String
  },
  computed: {
    table() {
      return this.$refs.table
    }
  },
  methods: {
    getLabel,
    handleCellClassName(params) {
      let { cellClassName } = this
      if (typeof cellClassName === 'function') cellClassName = cellClassName(params)

      let { column, rowIndex } = params

      return [cellClassName, `uiid-zd-${rowIndex}-${column.property}`].filter(Boolean).join(' ')
    }
  }
}
</script>
<style lang="scss" scoped>
.commonTableComponent {
  ::v-deep {
    // background: rgb(245, 247, 250);
    font-weight: normal;
  }
  ::v-deep .el-table--border th {
    border-right: none;
    border-bottom: none;
  }
  .required {
    color: red;
  }
}
.minicommonTableComponent {
  ::v-deep td {
    padding: 0px;
  }
  ::v-deep.cell {
    line-height: 1.25;
    .el-image {
      padding: 5px 0;
    }
  }
}
</style>
