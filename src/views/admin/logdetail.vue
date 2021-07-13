<template>
  <div class="app-container">
    <LogDetail />
  </div>
</template>

<script>
import LogDetail from './components/LogDetail'

export default {
  name: 'PagePermission',
  components: { LogDetail },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
