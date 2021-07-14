<template>
  <div>
    <div @click="dialogVisible = true">
      <svg-icon class-name="documentation" icon-class="documentation" />
    </div>

    <el-dialog title="About" :visible.sync="dialogVisible" width="30%">
      <p class="content">
        Subscribers to LINBIT's LINBIT-SDS subscriptions get a permanent license
        to use this GUI software. Re-distribution not allowed.
      </p>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">
          Confirm
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    handleClick() {
      this.dialogVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  line-height: 1.5;
  font-size: 1.2em;
  word-break: normal;
}
</style>
