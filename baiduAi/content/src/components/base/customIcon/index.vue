<template functional>
  <svg-icon
    v-if="props.iconClass"
    :icon-class="props.iconClass"
    :class-name="`${props.iconClass} ${data.staticClass || ''}`"
    v-bind="data"
  ></svg-icon>
  <i
    v-else
    v-bind="data"
  ></i>
</template>