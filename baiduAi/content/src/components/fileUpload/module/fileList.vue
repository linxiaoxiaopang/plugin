<template>
  <div class="file-list-component" :class="`file-list-component--${uploadSizSuffix}`">
    <draggable :list="files" v-bind="dragOption" class="list" @change="dragChange">
      <div
        class="item"
        v-for="(file, index) in files"
        :style="domStyle"
      >
        <div class="card-wrapper" :class="file.className">
          <div class="dialog" v-if="!hideDialog">
            <i class="el-icon-delete del-icon" :class="[`del-icon--${uploadSizSuffix}`]"
               @click="deleteHandler(file, index)"/>
          </div>
          <div class="file-wrapper">
            <div class="icon-wrapper" :style="{ 'height': !showFileName && '100%' }">
              <slot name="icon" :index="index" :file="file">
                <i class="iconfont icon-wenjian file-icon"/>
              </slot>
            </div>
            <span class="file-name" v-if="showFileName">{{ fileName(file) }}</span>
          </div>
        </div>
      </div>
    </draggable>
  </div>
</template>

<script>
// draggable 配置：https://segmentfault.com/a/1190000021376720
import draggable from 'vuedraggable'
import { validData } from '@/components/avue/utils/util'
import { OSS_SEPARATOR } from '@/utils/constant'
import {  getFillFileName } from '@/utils'

export default {
  components: {
    draggable
  },

  props: {
    title: String,

    files: {
      type: Array,
      required: true
    },

    domStyle: {
      type: Object,
      required: true
    },

    componentType: {
      type: String,
      default: 'picture'
    },

    uploadSizSuffix: {
      type: String | Number,
      required: true
    },

    showFileName: Boolean,
    dragDisabled: Boolean,
    hideDialog: Boolean
  },

  computed: {
    fileName({ title }) {
      return (file) => {
        let { name = '', path, url } = file
        url = validData(path, url)
        //存在title 返回title，title的权重高于file.name
        if (title) return title
        if (name) return name.split(OSS_SEPARATOR).shift()
        if (!url) return '暂无名称'
        return getFillFileName(url)
      }
    },

    dragOption({ dragDisabled }) {
      return {
        animation: 200,
        group: 'description',
        ghostClass: 'ghost',
        draggable: '.item',
        ...this.$attrs,
        disabled: dragDisabled
      }
    }
  },

  methods: {
    deleteHandler(...args) {
      this.$emit('deleteHandler', ...args)
    },

    dragChange(e) {
      this.$emit('dragChange', e)
      this.$emit('update:files', this.files)
    }
  }
}
</script>

<style lang="scss" scoped>

.file-list-component {
  display: inline-flex;
  flex-wrap: wrap;
  overflow: hidden;
}

.file-list-component--mini, .file-list-component--small {
  .del-icon {
    font-size: 23px;
  }

  .file-icon {
    font-size: 35px;
  }

  .file-name {
    font-size: $text-mini;
    line-height: 20px;
    height: 20px;
  }
}

.file-list-component--medium, .file-list-component--large {
  .del-icon {
    font-size: 30px;
  }

  .file-icon {
    font-size: 50px;
  }

  .file-name {
    font-size: $text-small;
    line-height: 26px;
    height: 26px;
  }
}

.list {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: -10px;
}


.item {
  margin-right: 10px;
  margin-bottom: 10px;
  background: #F7F8FA;

  .card-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    line-height: 1;

    .dialog {
      @include absPos();
      display: none;
      z-index: 1;
      background: $bg-opacity;

      i {
        color: $color-primary;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      .del-icon {
        color: #fff;
      }
    }
  }

  .card-wrapper:hover {
    .dialog {
      display: block;
    }
  }

  .file-wrapper {
    position: relative;
    width: 100%;
    height: 100%;

    .icon-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      overflow: hidden;
    }

    .file-icon {
      margin-bottom: 5px;
    }

    .file-name {
      position: absolute;
      bottom: 0;
      width: 100%;
      text-align: center;
      display: inline-block;
      word-break: break-all;
      @include overflow;
      color: #fff;
      background: $bg-opacity;
    }
  }
}
</style>
