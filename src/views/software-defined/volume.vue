<template>
  <div class="app-container">
    <Volume />
  </div>
</template>

<script>
import Volume from './components/Volume'

export default {
  name: 'PagePermission',
  components: { Volume },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
