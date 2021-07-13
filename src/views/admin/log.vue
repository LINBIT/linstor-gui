<template>
  <div class="app-container">
    <Log />
  </div>
</template>

<script>
import Log from './components/Log'

export default {
  name: 'PagePermission',
  components: { Log },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
