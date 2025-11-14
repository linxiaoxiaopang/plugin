<template>
  <el-radio-group v-model="text"
                  @change="handleChange"
                  :disabled="disabled"
                  :size="size"
  >
    <el-row :gutter="30">
      <el-col v-for="(item,index) in dic" :key="index" :span="1.5">
        <el-radio
          :label="item[dictValue] || item.value"
          :border="border"
          :uiid="`zd-radio-${index}`"
        >
          {{item[dictLabel] || item.label}}
        </el-radio>
      </el-col>
    </el-row>
  </el-radio-group>
</template>

<script>
import { validatenull } from '@/components/avue/utils/validate'

export default {
  name: "AvueCrudRadio",
  props: {
    value: {
      default: ""
    },
    size: {
      type: String,
      default: ''
    },
    border: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    dic: {
      type: Array,
      default: () => {
        return [];
      }
    },
    props: {
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      text: ""
    };
  },
  computed: {
    dictLabel() {
      return this.props.label || 'label'
    },
    dictValue() {
      return this.props.value || 'value'
    },
  },
  watch: {
    value: {
      handler() {
        this.text = this.value;
      },
      immediate: true
    },
    // 第一次点击，rules校验提示，第二次才消失
    text: {
      handler(n) {
        if (validatenull(this.value)) {
          this.$emit("input", n)
          this.$emit("change", n)
        }
      },
      immediate: true
    }
    // dic: {
    //   handler(n, o) {
    //     console.log(n);
    //   },
    //   immediate: true
    // }
  },
  methods: {
    handleChange(value) {
      this.$emit("input", value)
      this.$emit('search-change')
    }
  }
};
</script>

<style lang="scss" scoped>
.el-radio-group,
.el-row,
.el-col {
  line-height: inherit;
}
.el-radio {
  vertical-align: middle;
}
::v-deep {
  .el-radio__input {
    vertical-align: sub;
  }
}
</style>
