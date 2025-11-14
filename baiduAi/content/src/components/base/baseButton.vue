<template>
  <button
    class="el-button base-button"
    @click="handleClick"
    :disabled="buttonDisabled || loading"
    :autofocus="autofocus"
    :type="nativeType"
    :class="[
      type ? 'el-button--' + type : '',
      buttonSize ? 'el-button--' + buttonSize : '',
      {
        'is-disabled': buttonDisabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle
      }
    ]"
  >
    <i v-if="loading" class="el-icon-loading"></i>
    <customIcon v-if="icon && !loading" :option="icon"></customIcon>
    <span v-if="$slots.default"><slot></slot></span>
    <customIcon v-if="iconSuffix && !loading" :option="iconSuffix" :style="{'margin-left': $slots.default && '5px'}"></customIcon>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',

  inject: {
    elForm: {
      default: ''
    },
    elFormItem: {
      default: ''
    }
  },

  props: {
    type: {
      type: String,
      default: 'normal'
    },
    size: {
      type: String,
      // default: 'small'
    },
    icon: {
      type: String,
      default: ''
    },
    iconSuffix: {
      type: String,
      default: ''
    },
    nativeType: {
      type: String,
      default: 'button'
    },
    isLoading: {
      type: Boolean,
      default: true
    },
    loadingLock: Boolean,
    disabled: Boolean,
    plain: Boolean,
    autofocus: Boolean,
    round: Boolean,
    circle: Boolean
  },

  data() {
    return {
      loading: false
    }
  },

  computed: {
    _elFormItemSize() {
      return (this.elFormItem || {}).elFormItemSize;
    },
    buttonSize() {
      return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
    },
    buttonDisabled() {
      return this.disabled || (this.elForm || {}).disabled;
    }
  },

  watch: {
    '$attrs.loading': {
      handler(loading) {
        this.loading = loading
      },
      immediate: true
    }
  },

  methods: {
    handleClick(evt) {
      this.rewriteClick(evt)
    },

    async rewriteClick(e) {
      if (this.loading || !this.$listeners.click) return
      this.isLoading && (this.loading = true)
      try {
        await (this.loadingLock ? awaitLoading : awaitWrap)(this.$listeners.click.fns(e, this))
      } catch (e) {}
      this.loading = false
    }
  }
};
</script>
