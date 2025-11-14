<template>
  <el-checkbox-group
    v-model="text"
    @change="handleChange"
    :disabled="isDisabled"
    v-bind="$attrs"
    :class="{'disabled-normal': readonly}"
  >
    <el-checkbox
      v-for="(item,index) in dic" :label="item.value || item.dictValue"
      :key="index"
    >
      {{item.label || item.dictLabel}}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script>
import { validatenull } from '@/components/avue/utils/validate'

export default {
  name: "AvueCrudCheckbox",
  data() {
    return {
      text: []
    };
  },
  props: {
    value: {
      default: () => {
        return []
      }
    },
    dic: {
      default: () => {
        return []
      }
    },
    readonly: Boolean,
    disabled: Boolean
  },
  computed: {
    isDisabled({ readonly, disabled }) {
      return disabled || readonly
    }
  },
  watch: {
    value: {
      handler(n, o) {
        this.text = this.value
      },
      immediate: true,
      deep: true
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
  },
  created() {
    this.text = this.value;
  },
  mounted() {},
  methods: {
    handleChange(value) {
      this.$emit("input", value);
      this.$emit("change", value);
      this.$emit("search-change", value);
    }
  }
};
</script>

<style lang="scss">
.disabled-normal {
  .el-checkbox.is-disabled {
    .el-checkbox__input.is-disabled {
      .el-checkbox__inner {
        background-color: #FFF;
      }
      &.is-checked .el-checkbox__inner {
        background-color: #3841DB;
        border-color: #3841DB;
      }
      .el-checkbox__inner::after {
        border-color: #FFF;
      }
    }
    
    .el-checkbox__inner::after,
    .el-checkbox__inner,
    .el-checkbox__label {
      color: #666;
      cursor: pointer!important;
    }
  }
}
</style>
