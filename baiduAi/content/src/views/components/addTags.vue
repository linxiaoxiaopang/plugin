<template>
  <div class="multi-tags">
    <el-tag
      v-for="(item, index) in curVal"
      :key="index"
      class="tag-item"
      closable
      :disable-transitions="false"
      @close="handleDelete(index)">
      {{ item }}
    </el-tag>
    <el-input
      class="tag-item new-tag"
      v-if="inputVisible"
      v-model="inputValue"
      ref="saveTagInput"
      size="small"
      @keyup.enter.native="handleInputConfirm"
      @blur="handleInputConfirm"
    >
    </el-input>
    <el-button v-else class="tag-item new-tag" size="small" @click="showInput">+ New Tag</el-button>
  </div>
</template>

<script>
export default {
  props: {
    value: String|Array
  },
  data() {
    return {
      curVal: [''],
      inputVisible: false,
      inputValue: ''
    }
  },
  watch: {
    value: {
      handler(n) {
        // console.log(n)
        if (!Array.isArray(n)) {
          n = []
          this.oninput(n)
        }
        this.curVal = n
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    oninput(val) {
      console.log('oninput')
      this.$emit('input', val)
    },
    onchange(val) {
      this.$emit('change', val)
    },
    
    add() {
      this.curVal.push('')
    },
    handleDelete(index) {
      this.curVal.splice(index, 1)
    },
  
    showInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (inputValue) {
        this.curVal.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = '';
    }
  }
}
</script>

<style lang="scss">
.multi-tags {
  margin-right: -5px !important;
  margin-bottom: -5px !important;
  margin-left: -5px !important;
  > .tag-item {
    margin: 5px;
  }
  .new-tag {
    width: 88px;
  }
  .el-input__inner {
    padding: 0 8px;
  }
}
</style>
