<template>
  <div class="app-container">
    <SPList />
  </div>
</template>

<script>
import SPList from './components/SPList'

export default {
  name: 'PagePermission',
  components: { SPList },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
