<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.titleTemp"
        :placeholder="$t('sp_name')"
        style="width: 200px;margin-right: 20px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />
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
        style="margin-left: 10px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        {{ $t("table.add") }}
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
        :label="$t('sp_name')"
        width="150px"
        align="center"
        :filters="spNameList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="storage_pool_name"
        sortable
      >
        <template slot-scope="{ row }">
          <span>{{ row.storage_pool_name }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('sp_node')"
        width="150px"
        align="center"
        :filters="nodeFilterList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="node_name"
        sortable
      >
        <template slot-scope="{ row }">
          <span>{{ row.node_name }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('sp_type')"
        min-width="80px"
        :filters="spTypeList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="provider_kind"
        sortable
      >
        <template slot-scope="{ row }">
          <span>{{ row.provider_kind }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('sp_disk')"
        width="150px"
        align="center"
        :filters="spDiskList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="disk"
      >
        <template slot-scope="{ row }">
          <span>{{ row.props["StorDriver/StorPoolName"] }} </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('sp_capacity')" min-width="80px">
        <template v-if="row.total_capacity && row.free_capacity" slot-scope="{ row }">
          <span>{{ $t("sp_capacity_total") }}
            {{ Math.round(row.total_capacity / 1024 / 1024) }} GB,
            {{ $t("sp_free_capacity") }}
            {{ Math.round(row.free_capacity / 1024 / 1024) }} GB</span>
          <el-progress
            :text-inside="true"
            :stroke-width="26"
            :percentage="
              Math.floor((1 - row.free_capacity / row.total_capacity) * 100)
            "
          />
        </template>
        <template v-else>
          <span>{{ $t('no_info') }}}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('net_work_preference')"
        min-width="80px"
        sortable
        :sort-method="handlePreferenceSort"
        :filters="spPreferenceList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandlerPreference"
      >
        <template slot-scope="{ row }">
          <span>{{ row.props.PrefNic ? row.props.PrefNic: $t('net_work_preference_unset') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('sp_snapshot')"
        class-name="status-col"
        width="130"
      >
        <template slot-scope="{ row }">
          <el-tag v-if="row.supports_snapshots" type="success" effect="dark">
            {{ $t("sp_supports_snapshots") }}
          </el-tag>
          <el-tag v-else type="info">
            {{ $t("sp_not_supports_snapshots") }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('table.actions')"
        align="center"
        width="320"
        class-name="small-padding fixed-width"
      >
        <template slot-scope="{ row, $index }">
          <PropertyEditor
            type="storagepool"
            :row-data="row"
            @handleSubmit="saveConfig"
            @handlePropsEdit="handlePropsEdit"
          />
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            {{ $t("edit") }}
          </el-button>
          <el-popconfirm
            :title="$t('delete_confirm')"
            style="margin-left: 10px;"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            @onConfirm="handleDelete(row, $index)"
          >
            <el-button slot="reference" size="mini" type="danger">
              {{ $t("delete") }}
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
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item :label="$t('sp_name')" prop="storage_pool_name">
          <el-input v-model="temp.storage_pool_name" :disabled="dialogStatus === 'update'" clearable />
        </el-form-item>
        <el-form-item :label="$t('node')" prop="node_name">
          <el-select
            v-model="temp.node_name"
            class="filter-item"
            :placeholder="$t('please_select')"
            :disabled="dialogStatus === 'update'"
            clearable
          >
            <el-option
              v-for="item in nodeFilterList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('type')" prop="provider_kind">
          <el-select
            v-model="temp.provider_kind"
            class="filter-item"
            :placeholder="$t('please_select')"
            :disabled="dialogStatus === 'update'"
            clearable
          >
            <el-option
              v-for="item in ['LVM', 'LVM_THIN']"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('vg_name')" prop="vgName">
          <el-input v-model="temp.vgName" :disabled="dialogStatus === 'update'" clearable />
        </el-form-item>
        <el-form-item :label="$t('net_work_preference')" prop="networkName">
          <el-select
            v-model="temp.networkName"
            class="filter-item"
            :placeholder="$t('please_select')"
            clearable
          >
            <el-option
              v-for="item in networkList.filter(it=> temp.node_name === it.node_name)"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
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

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table
        :data="pvData"
        border
        fit
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">
          {{ $t("table.confirm") }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import * as networkApi from '@/api/network'
import * as spApi from '@/api/sp'
import * as nodeApi from '@/api/node'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import PropertyEditor from '@/components/PropertyEditor'
export default {
  name: 'SPList',
  components: { Pagination, PropertyEditor },
  directives: { waves },
  data() {
    return {
      tableKey: 0,
      list: [],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 10,
        title: '',
        titleTemp: ''
      },
      nodeFilterList: [], // 节点筛选
      spNameList: [], // 名称筛选
      spTypeList: [], // 类型筛选
      spDiskList: [], // 磁盘筛选
      networkList: [],
      spPreferenceList: [], // 优先网络筛选
      temp: {
        node_name: '',
        storage_pool_name: '',
        provider_kind: '',
        vgName: '',
        networkName: ''
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
        storage_pool_name: [
          { required: true, message: this.$t('name_required'), trigger: 'blur' }
        ],
        vgName: [
          { required: true, message: this.$t('name_required'), trigger: 'blur' }
        ],
        node_name: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        provider_kind: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ]
      },
      multipleSelection: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async saveConfig(data, cb) {
      console.log(data)
      await spApi.modify(this.temp.node_name, this.temp.storage_pool_name, data)
      this.$notify({
        title: this.$t('success'),
        message: this.$t("modified_successfully"),
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
        this.networkList = await networkApi.getAll()
        const nodeAll = await nodeApi.getAll()
        this.nodeFilterList = Array.from(new Set((nodeAll).map(el => el.name)))
        const list = Array.from(await spApi.getAll()).filter(el => {
          return this.listQuery.title === '' || el.storage_pool_name.toLowerCase().indexOf(this.listQuery.title.toLowerCase()) !== -1
        }).map(item => {
          item.tempData = JSON.parse(JSON.stringify(item))
          const node = nodeAll.find(node => node.name === item.node_name)
          let network = null
          if (node != null) {
            const networkName = item.props['PrefNic']
            if (networkName != null) {
              network = node.net_interfaces.find(net => net.name === networkName)
            }
            network = network || node.net_interfaces[0]
          }

          item.network = network

          return item
        })

        this.spNameList = Array.from(new Set(list.map(el => el.storage_pool_name)))
        this.spTypeList = Array.from(new Set(list.map(el => el.provider_kind)))
        this.spDiskList = Array.from(new Set(list.map(el => el.props['StorDriver/StorPoolName'])))
        this.spPreferenceList = Array.from(new Set(list.map(el => el.props.PrefNic || "")))

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
        node_name: '',
        storage_pool_name: '',
        provider_kind: '',
        vgName: '',
        networkName: ''
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
      this.$refs['dataForm'].validate(async valid => {
        if (valid) {
          const data = {
            'node_name': this.temp.node_name,
            'storage_pool_name': this.temp.storage_pool_name,
            'provider_kind': this.temp.provider_kind,
            'props': {
              'StorDriver/StorPoolName': this.temp.vgName
            }
          }
          if (this.temp.networkName !== '') {
            data.props['PrefNic'] = this.temp.networkName
          }
          await spApi.create(data)
          this.$notify({
            title: this.$t('success'),
            message: this.$t('added_successfully'),
            type: 'success',
            duration: 2000
          })
          this.dialogFormVisible = false
          await this.getList()
        }
      })
    },
    handleUpdate(row) {
      console.log(row, 'row')
      this.temp = {
        node_name: row.node_name,
        storage_pool_name: row.storage_pool_name,
        provider_kind: row.provider_kind,
        vgName: row.props['StorDriver/StorPoolName'] || '',
        networkName: row.props['PrefNic'] || ''
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
            'override_props': {
              'PrefNic': this.temp.networkName
            },
            'delete_props': [
            ],
            'delete_namespaces': [
            ]
          }
          await spApi.modify(this.temp.node_name, this.temp.storage_pool_name, data)
          this.$notify({
            title: this.$t('success'),
            message: this.$t('updated_successfully'),
            type: 'success',
            duration: 2000
          })
          this.dialogFormVisible = false
          await this.getList()
        }
      })
    },
    async handleDelete(row, index) {
      await spApi.remove(row.node_name, row.storage_pool_name)
      this.$notify({
        title: this.$t('success'),
        message: this.$t('deleted_successfully'),
        type: 'success',
        duration: 2000
      })
      await this.getList()
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    },
    filterHandlerPreference(value, row, column) {
      return row.props.PrefNic === value
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    async handleBatchDelete() {
      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await spApi.remove(row.node_name, row.storage_pool_name)
      }
      this.$notify({
        title: this.$t('success'),
        message: this.$t('deleted_successfully'),
        type: 'success',
        duration: 2000
      })
      await this.getList()
    },
    handlePreferenceSort(a, b) {
      const aPrefNic = a.props.PrefNic ? a.props.PrefNic : 'a'
      const bPrefNic = b.props.PrefNic ? b.props.PrefNic : 'a'
      return aPrefNic - bPrefNic
    },
    handlePropsEdit(row) {
      this.temp = row.tempData
    }
  }
}
</script>
