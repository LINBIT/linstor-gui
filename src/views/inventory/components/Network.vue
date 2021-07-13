<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.titleTemp"
        :placeholder="$t('net_work_name')"
        style="width: 200px;margin-right: 20px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        {{ $t('table.search') }}
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        {{ $t('table.add') }}
      </el-button>
      <el-popconfirm
        v-if="multipleSelection.length !== 0"
        :title="$t('delete_confirm')"
        style="margin-left: 10px;"
        :confirm-button-text="$t('yes')"
        :cancel-button-text="$t('no')"
        @onConfirm="handleBatchDelete"
      >
        <el-button
          slot="reference"
          class="filter-item"
          type="danger"
          icon="el-icon-delete"
        >
          {{ $t('batch_delete') }}
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
      style="width: 100%;"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        type="selection"
        width="55"
      />

      <el-table-column
        :label="$t('node')"
        min-width="80px"
        property="node_name"
        sortable
        :filters="nodeFilterList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
      >
        <template slot-scope="{row}">
          <span>{{ row.node_name }}</span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('net_work_address')"
        min-width="60px"
        sortable
        :sort-method="handleSort"
      >
        <template slot-scope="{row}">
          <span>{{ row.address }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('net_work_port')" class-name="status-col" min-width="60">
        <template slot-scope="{row}">
          {{ row.satellite_port }}
          <el-tag v-if="row.is_active" type="success" effect="plain" style="margin-left: 10px;">
            {{ $t('network_management') }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('net_work_name')"
        min-width="60px"
        sortable
        :sort-method="handleSort"
        :filters="ipFilterList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="name"
      >
        <template slot-scope="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('uuid')" min-width="100px">
        <template slot-scope="{row}">
          <span>{{ row.uuid }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.actions')" align="center" width="320" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            {{ $t('edit') }}
          </el-button>
          <el-popconfirm
            :title="$t('delete_confirm')"
            style="margin-left: 10px;"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            @onConfirm="handleDelete(row,$index)"
          >
            <el-button slot="reference" size="mini" type="danger">
              {{ $t('delete') }}
            </el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
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
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item :label="$t('node')" prop="node_name">
          <el-select
            v-model="temp.node_name"
            class="filter-item"
            :placeholder="$t('please_select')"
            :disabled="dialogStatus === 'update'"
            clearable
          >
            <el-option
              v-for="item in nodeList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('net_work_name')" prop="name">
          <el-input v-model="temp.name" :disabled="dialogStatus === 'update'" clearable />
        </el-form-item>

        <el-form-item :label="$t('net_work_address')" prop="ip">
          <el-input v-model="temp.ip" clearable />
        </el-form-item>

        <el-form-item :label="$t('net_work_port')" prop="satellite_port">
          <el-input v-model="temp.satellite_port" clearable />
        </el-form-item>

        <el-form-item :label="$t('node_default_ip')" prop="is_active">
          <el-radio-group v-model="temp.is_active" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          {{ $t('table.cancel') }}
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          {{ $t('table.confirm') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as networkApi from '@/api/network'
import * as nodeApi from '@/api/node'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination'
import * as rules from '@/utils/rules'

export default {
  name: 'Network',
  components: { Pagination },
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
        title: '',
        titleTemp: ''
      },
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['published', 'draft', 'deleted'],
      showReviewer: false,
      temp: {
        name: '',
        ip: '',
        satellite_port: 3366,
        node_name: '',
        communication_type: 'plain',
        is_active: false
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: this.$t('edit'),
        create: this.$t('create')
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'blur' }],
        ip: [{ required: true, message: 'ip is required', trigger: 'blur' }],
        node_name: [{ required: true, message: 'node is required', trigger: 'change' }],
        satellite_port: [{ required: true, validator: rules.checkPort, trigger: 'blur' }]
      },
      multipleSelection: [],
      nodeFilterList: [], // 筛选时的列表
      nodeList: [], // 新建时选择的node列表
      ipFilterList: [] // ip别名筛选时的列表
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.resetTemp()
      this.listLoading = true
      try {
        const nodeList = await nodeApi.getAll()
        const list = Array.from(await networkApi.getAll()).filter(el => {
          return this.listQuery.title === '' || el.name.toLowerCase().indexOf(this.listQuery.title.toLowerCase()) !== -1
        })
        this.nodeFilterList = Array.from(new Set(list.map(el => el.node_name)))
        this.ipFilterList = Array.from(new Set(list.map(el => el.name)))
        this.nodeList = nodeList.map(el => el.name)
        const offset = (this.listQuery.page - 1) * this.listQuery.limit
        this.list = list.slice(offset, offset + this.listQuery.limit)
        this.total = list.length
      } finally {
        this.listLoading = false
      }
    },
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.title = this.listQuery.titleTemp
      this.getList()
    },
    resetTemp() {
      this.temp = {
        name: '',
        ip: '',
        satellite_port: 3366,
        node_name: '',
        communication_type: 'plain',
        is_active: false
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate(async(valid) => {
        if (valid) {
          const data = {
            'name': this.temp.name,
            'address': this.temp.ip,
            'satellite_port': this.temp.satellite_port,
            'satellite_encryption_type': this.temp.communication_type,
            'is_active': this.temp.is_active
          }
          await networkApi.create(this.temp.node_name, data)
          this.$notify({
            title: this.$t('success'),
            message: this.$t('added_successfully'),
            type: 'success',
            duration: 2000
          })
          console.log('createData', this.temp)
          this.dialogFormVisible = false
          await this.getList()
        }
      })
    },
    handleUpdate(row) {
      this.temp = {
        name: row.name,
        ip: row.address,
        satellite_port: row.satellite_port,
        node_name: row.node_name,
        communication_type: row.satellite_encryption_type,
        is_active: row.is_active
      }
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate(async(valid) => {
        if (valid) {
          const data = {
            'name': this.temp.name,
            'address': this.temp.ip,
            'satellite_port': this.temp.satellite_port,
            'satellite_encryption_type': this.temp.communication_type,
            'is_active': this.temp.is_active
          }
          await networkApi.modify(this.temp.node_name, this.temp.name, data)
          this.dialogFormVisible = false
          this.$notify({
            title: this.$t('success'),
            message: this.$t('updated_successfully'),
            type: 'success',
            duration: 2000
          })
          console.log('updateData', this.temp)
          await this.getList()
        }
      })
    },
    async handleDelete(row, index) {
      await networkApi.remove(row.node_name, row.name)
      this.$notify({
        title: this.$t('success'),
        message: this.$t('deleted_successfully'),
        type: 'success',
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
        await networkApi.remove(row.node_name, row.name)
      }

      this.$notify({
        title: this.$t('success'),
        message: this.$t('deleted_successfully'),
        type: 'success',
        duration: 2000
      })
      await this.getList()
    },
    handleSort(a, b) {
      const ip1 = a.address.split('.').map(el => el.padStart(3, '0')).join('')
      const ip2 = b.address.split('.').map(el => el.padStart(3, '0')).join('')
      return ip1 - ip2
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    }
  }
}
</script>
