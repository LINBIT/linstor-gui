<template>
  <div class="app-container">
    <ControllerList />
  </div>
</template>

<script>
import ControllerList from './components/ControllerList'

export default {
  name: 'PagePermission',
  components: { ControllerList },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
