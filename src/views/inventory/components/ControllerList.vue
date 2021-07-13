<template>
  <div class="app-container">
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
    >
      <el-table-column :label="$t('controller_ip')" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.ip === "::" ? "0.0.0.0" : row.ip }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        align="center"
        width="320"
        class-name="small-padding fixed-width"
      >
        <template slot-scope="{ row }">
          <PropertyEditor
            type="controller"
            :row-data="row"
            @handleSubmit="saveConfig"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import * as controller from "@/api/controller"
import waves from "@/directive/waves" // waves directive
import PropertyEditor from '@/components/PropertyEditor'

export default {
  name: "NodeList",
  directives: { waves },
  components: {
    PropertyEditor
  },
  data() {
    return {
      tableKey: 0,
      list: [],
      total: 0,
      listLoading: true,
      current: null
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async saveConfig(data, cb) {
      console.log(data)
      await controller.modify(data)
      this.$notify({
        title: this.$t('success'),
        message: this.$t("modified_successfully"),
        type: "success",
        duration: 2000
      })
      cb()
      await this.getList()
    },
    async getList() {
      this.listLoading = true
      try {
        const config = await controller.config()
        const props = await controller.getAll()
        this.current = props
        this.list = [
          {
            ip: config.http.listen_address,
            props
          }
        ]
      } finally {
        this.listLoading = false
      }
    }
  }
}
</script>

<style scoped>
.cancel__btn {
  position: relative;
  top: -4.1em;
}
</style>
