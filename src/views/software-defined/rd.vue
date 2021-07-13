<template>
  <div class="app-container">
    <RDList />
  </div>
</template>

<script>
import RDList from './components/RDList'

export default {
  name: 'PagePermission',
  components: { RDList },
  methods: {
    handleRolesChange() {
      this.$router.push({ path: '/permission/index?' + +new Date() })
    }
  }
}
</script>
