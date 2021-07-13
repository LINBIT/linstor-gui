<template>
  <div class="app-container">
    <Network />
  </div>
</template>

<script>
import Network from './components/Network'

export default {
  name: 'PagePermission',
  components: { Network },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
