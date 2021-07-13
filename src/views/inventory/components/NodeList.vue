<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.titleTemp"
        :placeholder="$t('node_name')"
        style="width: 200px; margin-right: 20px"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />
      <el-select
        v-model="listQuery.importanceTemp"
        :placeholder="$t('node_status')"
        clearable
        style="width: 120px; margin-right: 20px"
        class="filter-item"
      >
        <el-option
          v-for="item in importanceOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        {{ $t("table.search") }}
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        {{ $t("table.add") }}
      </el-button>
      <el-popconfirm
        v-if="multipleSelection.length !== 0"
        :title="$t('delete_confirm')"
        style="margin-left: 10px"
        :confirm-button-text="$t('yes')"
        :cancel-button-text="$t('no')"
        @onConfirm="handleBatchDelete"
      >
        <el-button
          slot="reference"
          class="filter-item"
          type="warning"
          icon="el-icon-delete"
        >
          {{ $t("batch_delete") }}
        </el-button>
      </el-popconfirm>

      <el-popconfirm
        v-if="multipleSelection.length !== 0"
        :title="$t('delete_confirm')"
        style="margin-left: 10px"
        :confirm-button-text="$t('yes')"
        :cancel-button-text="$t('no')"
        @onConfirm="handleBatchLost"
      >
        <el-button
          slot="reference"
          class="filter-item"
          type="danger"
          icon="el-icon-delete"
        >
          {{ $t("batch_lost") }}
        </el-button>
      </el-popconfirm>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column
        :label="$t('node_name')"
        width="150px"
        align="center"
        sortable
        sort-by="name"
      >
        <template slot-scope="scope">
          <el-badge
            v-if="scope.row.connection_status === 'ONLINE'"
            type="success"
            :is-dot="true"
            style="margin-top: 10px; margin-right: 10px"
          />
          <el-badge
            v-else
            type="danger"
            :is-dot="true"
            style="margin-top: 10px; margin-right: 10px"
          />
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('node_default_ip')"
        width="150px"
        align="center"
        sortable
        :sort-method="handleSort"
      >
        <template slot-scope="{ row }">
          <span>{{
            (
              row.net_interfaces.find((item) => item.is_active) || {
                address: "",
              }
            ).address
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('node_default_port')"
        width="150px"
        align="center"
      >
        <template slot-scope="{ row }">
          <span>{{
            (
              row.net_interfaces.find((item) => item.is_active) || {
                satellite_port: "",
              }
            ).satellite_port
          }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('uuid')" width="140">
        <template slot-scope="{ row }">
          <span>{{ row.uuid }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('node_status')"
        class-name="status-col"
        width="140"
      >
        <template slot-scope="{ row }">
          <el-tag
            v-if="row.connection_status === 'ONLINE'"
            type="success"
            effect="dark"
          >
            {{ row.connection_status }}
          </el-tag>
          <el-tag v-else type="info">
            {{ row.connection_status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        align="center"
        min-width="500"
        class-name="small-padding fixed-width"
      >
        <template slot-scope="{ row, $index }">
          <PropertyEditor
            type="node"
            :row-data="row"
            @handleSubmit="saveProp"
            @handlePropsEdit="handlePropsEdit"
          />

          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            {{ $t("edit") }}
          </el-button>
          <el-popconfirm
            :title="$t('delete_confirm')"
            style="margin-left: 10px"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            @onConfirm="handleDelete(row, $index)"
          >
            <el-button slot="reference" size="mini" type="warning">
              {{ $t("delete") }}
            </el-button>
          </el-popconfirm>

          <el-popconfirm
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            :title="$t('delete_confirm')"
            style="margin-left: 10px"
            @onConfirm="handleLost(row, $index)"
          >
            <el-button slot="reference" size="mini" type="danger">
              {{ $t("lost") }}
            </el-button>
          </el-popconfirm>

          <el-popconfirm
            v-if="row.flags && row.flags.includes('EVICTED')"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            :title="$t('delete_confirm')"
            style="margin-left: 10px"
            @onConfirm="handleRestore(row, $index)"
          >
            <el-button slot="reference" size="mini" type="success">
              {{ $t("restore") }}
            </el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="120px"
        style="width: 400px; margin-left: 50px"
      >
        <el-form-item :label="$t('node_name')" prop="name">
          <el-input
            v-model="temp.name"
            :disabled="dialogStatus === 'update'"
            clearable
          />
        </el-form-item>
        <el-form-item :label="$t('node_default_ip')" prop="ip">
          <el-input v-model="temp.ip" clearable />
        </el-form-item>
        <el-form-item :label="$t('node_default_port')" prop="port">
          <el-input v-model="temp.port" clearable />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          {{ $t("table.cancel") }}
        </el-button>
        <el-button
          type="primary"
          @click="dialogStatus === 'create' ? createData() : updateData()"
        >
          {{ $t("table.confirm") }}
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :title="$t('prop_editor')" :visible.sync="editPropModal">
      <el-button
        type="primary"
        @click="hanldeSelectProps"
      >Select Property</el-button>
      <form-create v-model="propsData" :rule="ruleDisplay" :option="option" />
    </el-dialog>

    <el-dialog :title="$t('select_editor')" :visible.sync="selectPropModal">
      <el-select
        v-model="selectedProps"
        filterable
        clearable
        placeholder="Please Select"
        @change="hanleSelect"
      >
        <el-option
          v-for="item in rule.filter((el) => !el.show)"
          :key="item.field"
          :label="item.title"
          :value="item.field"
        />
      </el-select>
    </el-dialog>
  </div>
</template>

<script>
import * as nodeApi from "@/api/node"
import * as networkApi from "@/api/network"
import waves from "@/directive/waves" // waves directive
import Pagination from "@/components/Pagination"
import { handlePropsToFormOption } from "@/utils"
import * as rules from "@/utils/rules"
import PropertyEditor from "@/components/PropertyEditor"

export default {
  name: "NodeList",
  components: { Pagination, PropertyEditor },
  directives: { waves },
  data() {
    return {
      tableKey: 0,
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        importance: "",
        importanceTemp: "",
        title: "",
        titleTemp: ""
      },
      importanceOptions: [
        "OFFLINE",
        "CONNECTED",
        "ONLINE",
        "VERSION_MISMATCH",
        "FULL_SYNC_FAILED",
        "AUTHENTICATION_ERROR",
        "UNKNOWN",
        "HOSTNAME_MISMATCH",
        "OTHER_CONTROLLER"
      ],
      sortOptions: [
        { label: "ID Ascending", key: "+id" },
        { label: "ID Descending", key: "-id" }
      ],
      statusOptions: ["published", "draft", "deleted"],
      showReviewer: false,
      temp: {
        name: "",
        ip: "",
        port: 3366,
        node_type: "satellite",
        communication_type: "plain"
      },
      dialogFormVisible: false,
      dialogStatus: "",
      textMap: {
        update: this.$t("edit"),
        create: this.$t("create")
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        name: [
          { required: true, message: "name is required", trigger: "blur" }
        ],
        ip: [{ required: true, message: "ip is required", trigger: "blur" }],
        port: [{ required: true, validator: rules.checkPort, trigger: "blur" }]
      },
      multipleSelection: [],
      nodePropsArrData: [], // Props Editor
      propsData: {}, // Property Editor Data
      currentNode: null,
      option: {
        // Property Editor
        onSubmit: (formData) => {
          this.saveProp(formData)
        },
        submitBtn: {
          innerText: "Submit"
        }
      },
      rule: [], // Property Editor
      selectPropModal: false,
      editPropModal: false,
      selectedProps: ""
    }
  },
  computed: {
    ruleDisplay: function() {
      // Props hava val or newly added
      return this.rule.filter((el) => el.show)
    }
  },
  created() {
    this.getList()
    this.rule = handlePropsToFormOption("node")
  },
  methods: {
    async saveProp(data, cb) {
      console.log(data)

      await nodeApi.modify(this.currentNode.name, data)
      this.$notify({
        title: this.$t("success"),
        message: this.$t("added_successfully"),
        type: "success",
        duration: 2000
      })
      cb && cb()
      await this.getList()
    },
    async getList() {
      this.resetTemp()
      this.listLoading = true
      try {
        const list = Array.from(await nodeApi.getAll()).filter((it) => {
          return (
            (this.listQuery.title === "" ||
              it.name
                .toLowerCase()
                .indexOf(this.listQuery.title.toLowerCase()) !== -1) &&
            (this.listQuery.importance === "" ||
              it.connection_status === this.listQuery.importance)
          )
        })
        const offset = (this.listQuery.page - 1) * this.listQuery.limit
        this.list = list.slice(offset, offset + this.listQuery.limit)
        this.total = list.length
      } finally {
        this.listLoading = false
      }
    },
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.importance = this.listQuery.importanceTemp
      this.listQuery.title = this.listQuery.titleTemp
      this.getList()
    },
    resetTemp() {
      this.temp = {
        name: "",
        ip: "",
        port: 3366,
        node_type: "satellite",
        communication_type: "plain"
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = "create"
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs["dataForm"].clearValidate()
      })
    },
    createData() {
      this.$refs["dataForm"].validate(async(valid) => {
        if (valid) {
          await nodeApi.create({
            name: this.temp.name,
            type: this.temp.node_type,
            net_interfaces: [
              {
                name: "default",
                address: this.temp.ip,
                satellite_port: this.temp.port,
                satellite_encryption_type: this.temp.communication_type
              }
            ]
          })

          this.$notify({
            title: this.$t("success"),
            message: this.$t("added_successfully"),
            type: "success",
            duration: 2000
          })
          console.log("createData", this.temp)
          this.dialogFormVisible = false
          await this.getList()
        }
      })
    },
    handleUpdate(row) {
      this.temp = {
        name: row.name,
        ip: (
          row.net_interfaces.find((item) => item.is_active) || { address: "" }
        ).address,
        port: (
          row.net_interfaces.find((item) => item.is_active) || {
            satellite_port: 3366
          }
        ).satellite_port,
        node_type: row.type,
        communication_type: (
          row.net_interfaces.find((item) => item.is_active) || {
            satellite_encryption_type: "plain"
          }
        ).satellite_encryption_type,
        row: row
      }
      this.dialogStatus = "update"
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs["dataForm"].clearValidate()
      })
    },
    updateData() {
      this.$refs["dataForm"].validate(async(valid) => {
        if (valid) {
          const network = this.temp.row.net_interfaces.find(
            (item) => item.is_active
          )
          if (network) {
            const data = {
              name: this.temp.row.net_interfaces.find((item) => item.is_active)
                .name,
              address: this.temp.ip,
              satellite_port: this.temp.port,
              satellite_encryption_type: this.temp.communication_type,
              is_active: true
            }
            await networkApi.modify(
              this.temp.row.name,
              this.temp.row.net_interfaces.find((item) => item.is_active).name,
              data
            )
          } else {
            const data = {
              name: "default",
              address: this.temp.ip,
              satellite_port: this.temp.port,
              satellite_encryption_type: this.temp.communication_type,
              is_active: true
            }
            await networkApi.create(this.temp.row.name, data)
          }

          this.dialogFormVisible = false
          this.$notify({
            title: this.$t("success"),
            message: this.$t("更新成功"),
            type: "success",
            duration: 2000
          })
          console.log("updateData", this.temp)
          await this.getList()
        }
      })
    },
    handlePropsEdit(row) {
      this.currentNode = row
      this.rule = handlePropsToFormOption("node", row.props)
    },
    async handleReconnect(row) {
      // 重连
      await nodeApi.reconnect(row.name)
      this.$notify({
        title: this.$t("success"),
        message: this.$t("reconnected_successfully"),
        type: "success",
        duration: 2000
      })
      await this.getList()
    },
    async handleDelete(row, index) {
      await nodeApi.deleteNode(row.name)
      this.$notify({
        title: this.$t("success"),
        message: this.$t("deleted_successfully"),
        type: "success",
        duration: 2000
      })
      await this.getList()
    },
    async handleLost(row, index) {
      // 强制删除
      await nodeApi.lost(row.name)
      this.$notify({
        title: this.$t("success"),
        message: this.$t("lost_successfully"),
        type: "success",
        duration: 2000
      })
      await this.getList()
    },
    async handleRestore(row, index) {
      // 恢复节点
      await nodeApi.restore(row.name)
      this.$notify({
        title: this.$t("success"),
        message: "restore success",
        type: "success",
        duration: 2000
      })
      await this.getList()
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    async handleBatchDelete() {
      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await nodeApi.deleteNode(row.name)
      }
      this.$notify({
        title: this.$t("success"),
        message: this.$t("deleted_successfully"),
        type: "success",
        duration: 2000
      })
      await this.getList()
    },
    async handleBatchLost() {
      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await nodeApi.lost(row.name)
      }
      this.$notify({
        title: this.$t("success"),
        message: this.$t("deleted_successfully"),
        type: "success",
        duration: 2000
      })
      await this.getList()
    },
    handleSort(a, b) {
      const ip1 = a.net_interfaces
        .find((item) => item.is_active)
        .address.split(".")
        .map((el) => el.padStart(3, "0"))
        .join("")
      const ip2 = b.net_interfaces
        .find((item) => item.is_active)
        .address.split(".")
        .map((el) => el.padStart(3, "0"))
        .join("")
      return ip1 - ip2
    },
    hanldeSelectProps() {
      this.selectPropModal = true
    },
    hanleSelect(val) {
      // 处理单个添加的属性
      this.rule = this.rule.map((el) =>
        el.field === val ? { ...el, show: true } : el
      )
      this.selectPropModal = false
      this.selectedProps = ""
    }
  }
}
</script>
