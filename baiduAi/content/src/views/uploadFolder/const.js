export const option = {
  topPage: false,
  isOnePage: false,
  menu: true,
  menuWidth: 100,
  menuAlign: 'left',
  pageSizes: [5, 10, 20, 50, 200],
  column: [
    {
      label: '图片',
      prop: 'image',
      slot: true
    },
    {
      label: '图片标签',
      prop: 'tag',
      slot: true
    },
    {
      label: '所属文件夹',
      prop: 'imageFolderId'
    }
  ]
}
