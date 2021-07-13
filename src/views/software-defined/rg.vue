<template>
  <div class="app-container">
    <RGList />
  </div>
</template>

<script>
import RGList from './components/RGList'

export default {
  name: 'PagePermission',
  components: { RGList },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
