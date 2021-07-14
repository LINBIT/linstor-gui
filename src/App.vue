<template>
  <div id="app">
    <router-view v-if="appEnable" />
    <div v-else>
      Please contact <a href="https://linbit.com/" target="_blank">Linbit</a> to
      enale this product.
    </div>
    <el-dialog title="Notice" :visible.sync="dialogVisible" width="30%">
      <span>Please contact Linbit to enale this product.</span>
      <span slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          @click="dialogVisible = false"
        >Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import * as system from "@/api/system"

const MSG = "The SpaceTracking service is not installed."

export default {
  name: "App",
  data() {
    return {
      appEnable: false,
      dialogVisible: false
    }
  },
  created() {
    this.getAppInfo()
  },
  methods: {
    async getAppInfo() {
      try {
        const data = await system.getSpaceReport()
        console.log(data, "SpaceReport")

        if (data?.reportText === MSG) {
          this.appEnable = false
          this.dialogVisible = true
        } else {
          this.appEnable = true
        }
      } catch (error) {
        console.log(error, "error")
        this.appEnable = false
        this.dialogVisible = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  margin: 1em;
}
</style>
