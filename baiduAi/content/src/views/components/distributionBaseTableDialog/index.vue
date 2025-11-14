<script>
import  distributionDialog from '@/views/components/distributionDialog'
import AgentTable from './module/agentTable'

export default {
  extends: distributionDialog,
  computed: {
    componentName() {
      return AgentTable
    }
  }
}

</script>

<style lang="scss" scoped>

</style>
