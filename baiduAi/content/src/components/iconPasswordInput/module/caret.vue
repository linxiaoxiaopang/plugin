<template>
  <div class="custom-caret">
    <slot></slot>
    <div :class="{ caret: isFocus }"></div>
  </div>
</template>

<script>
export default {
  props: {
    isFocus: Boolean
  }
}
</script>

<style lang="scss" scoped>
.custom-caret {
  position: relative;
  .caret {
    content: '';
    position: absolute;
    top: 50%;
    left: 15px;
    transform: translateY(-50%);
    height: 1.3em;
    border-left: 1px solid #606266;
    animation: caret 1s infinite;
  }
  @keyframes caret {
    0% {
      border-color: transparent;
    }
    10% {
      border-color: #606266;
    }
    20% {
      border-color: #606266;
    }
    30% {
      border-color: #606266;
    }
    40% {
      border-color: #606266;
    }
    50% {
      border-color: #606266;
    }
    60% {
      border-color: transparent;
    }
    100% {
      border-color: transparent;
    }
  }
}
</style>