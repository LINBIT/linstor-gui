<template>
  <div class="app-container">
    <NodeList />
  </div>
</template>

<script>
import NodeList from './components/NodeList'

export default {
  name: 'PagePermission',
  components: { NodeList },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
