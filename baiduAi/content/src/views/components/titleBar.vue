<script>
export default {
  functional: true,

  render(h, { props: { customClass, showLabel }, scopedSlots }) {
    const show = showLabel || showLabel == undefined
    return (
      <div class={[show && 'title-bar', customClass]}>
        <p class="text">{scopedSlots.default()}</p>
      </div>
    )
  }
}
</script>

<style scoped lang="scss">
.title-bar {
  height: 20px;
  .text {
    font-size: $text-medium;
    color: $color-content;
    border-left: 3px solid $--color-primary;
    padding-left: 6px;
    line-height: 20px;
  }
}
</style>
