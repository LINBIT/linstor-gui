<template>
  <div class="app-container">
    <Resource />
  </div>
</template>

<script>
import Resource from './components/Resource'

export default {
  name: 'PagePermission',
  components: { Resource },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
