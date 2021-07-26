<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.titleTemp"
        :placeholder="$t('name')"
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
        :disabled="readonly"
        :confirm-button-text="$t('yes')"
        :cancel-button-text="$t('no')"
        @onConfirm="handleBatchDelete"
      >
        <el-button
          slot="reference"
          class="filter-item"
          type="danger"
          icon="el-icon-delete"
          :disabled="readonly"
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
        :label="$t('resource_name')"
        min-width="80px"
        prop="name"
        sortable
      />

      <el-table-column
        :label="$t('resource_node')"
        min-width="60px"
        sortable
        prop="node"
        :filters="nodeFilterList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
      />

      <el-table-column
        :label="$t('resource_port')"
        min-width="60px"
        sortable
        prop="port"
      />

      <el-table-column :label="$t('resource_usage')" class-name="status-col" min-width="60">
        <template slot-scope="{row}">
          <el-tag type="info" effect="plain" style="margin-left: 10px;">
            {{ $t(row.usage) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="$t('resource_conns')" class-name="status-col" min-width="60">
        <template slot-scope="{row}">
          <el-tag type="info" effect="plain" style="margin-left: 10px;">
            {{ $t(row.conns) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column class-name="status-col" min-width="60">
        <template slot-scope="{row}">
          <el-tag type="info" effect="plain" style="margin-left: 10px;">
            {{ $t(row.state) }}
          </el-tag>
        </template>
        <template
          slot="header"
        >
          <i
            class="el-icon-refresh-right"
            @click="getList(false)"
          />
          <span style="margin-left: 10px;">{{ $t('resource_state') }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('resource_created_on')" min-width="100px">
        <template slot-scope="{row}">
          {{ row.created_on | parseTime }}
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.actions')" align="center" width="320" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <PropertyEditor
            type="resource"
            :row-data="row"
            @handleSubmit="saveConfig"
            @handlePropsEdit="handlePropsEdit"
          />
          <el-button type="primary" size="mini" :disabled="readonly" @click="handleUpdate(row)">
            {{ $t('edit') }}
          </el-button>
          <el-popconfirm
            :title="$t('delete_confirm')"
            style="margin-left: 10px;"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            @onConfirm="handleDelete(row,$index)"
          >
            <el-button slot="reference" size="mini" type="danger" :disabled="readonly">
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
        <el-form-item v-if="dialogStatus === 'create'" :label="$t('rd_name')" prop="name">
          <el-select
            v-model="temp.name"
            class="filter-item"
            :placeholder="$t('please_select')"
            clearable
          >
            <el-option
              v-for="item in rdListFilter"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="dialogStatus === 'create'" :label="$t('allocate_method')" prop="method">
          <el-radio-group v-model="temp.method" clearable>
            <el-radio label="Manual">{{ $t('manual') }}</el-radio>
            <el-radio label="Auto">{{ $t('auto') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="temp.method === 'Manual' && dialogStatus === 'create'" :label="$t('node')" prop="node">
          <el-select
            v-model="temp.node"
            class="filter-item"
            :placeholder="$t('please_select')"
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

        <el-form-item v-if="temp.method === 'Auto' && dialogStatus === 'create'" :label="$t('auto_place')" prop="auto_place">
          <el-input v-model="temp.auto_place" type="number" min="1" max="32" clearable />
        </el-form-item>

        <el-form-item v-if="dialogStatus === 'create'" :label="$t('diskless')" prop="diskless_on_remaining">
          <el-radio-group v-model="temp.diskless_on_remaining" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('sp_name_list')" prop="'storage_pool">
          <el-select
            v-model="temp.storage_pool"
            class="filter-item"
            :placeholder="$t('please_select')"
            clearable
          >
            <el-option
              v-for="item in spNameList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="temp.method === 'Manual'" :label="$t('net_work_preference')" prop="net_work_preference">
          <el-select
            v-model="temp.network"
            class="filter-item"
            :placeholder="$t('please_select')"
            clearable
          >
            <el-option
              v-for="item in preferenceNetWorkList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
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
import { mapGetters } from 'vuex'
import * as rgApi from '@/api/rg'
import * as nodeApi from '@/api/node'
import * as spApi from '@/api/sp'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination'
import PropertyEditor from '@/components/PropertyEditor'
import lodash from 'lodash'

export default {
  name: 'Network',
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
        title: '',
        titleTemp: ''
      },
      temp: {
        name: '',
        node: '',
        method: 'Manual',
        auto_place: 2,
        diskless_on_remaining: false,
        network: '',
        storage_pool: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: this.$t('edit'),
        create: this.$t('create')
      },
      spNameList: [],
      preferenceNetWorkList: [],
      dialogPvVisible: false,
      pvData: [],
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'blur' }],
        node: [{ required: true, message: 'node is required', trigger: 'change' }]
      },
      multipleSelection: [],
      nodeFilterList: [], // 筛选时的列表
      nodeList: [], // 新建时选择的node列表
      nodeDataList: [], // 新建时选择的node列表
      spDataList: [],
      rdListFilter: [],
      readonly: false // 只读
    }
  },
  computed: {
    ...mapGetters([
      'roles'
    ])
  },
  watch: {
    'temp.name'(val) {
      console.log(val, 'val')
      if (this.dialogStatus === 'create') {
        const selectedRD = this.rdList.find(el => el.name === val)
        console.log(selectedRD, 'selectedRG')
        if (selectedRD) {
          this.temp.storage_pool = selectedRD.storage_pool_list[0] || ''
        } else {
          this.temp.storage_pool = ''
        }
      }
    },
    'temp.node'(val) {
      if (this.dialogStatus === 'create') {
        const selectedNode = this.nodeDataList.find(el => el.name === val)
        console.log(selectedNode, 'selectedNode')
        if (selectedNode) {
          this.preferenceNetWorkList = selectedNode.net_interfaces.map(it => it.name)
          this.temp.network = this.preferenceNetWorkList[0] || ''
        } else {
          this.preferenceNetWorkList = []
          this.temp.network = ''
        }
      }
    }
  },
  created() {
    this.getList()
    this.readonly = this.roles.indexOf('read') > -1
  },
  methods: {
    async saveConfig(data, cb) {
      console.log(data)
      await rgApi.updateResource(this.currentPropsEdit.name, this.currentPropsEdit.node, data)
      this.$notify({
        title: this.$t('success'),
        message: this.$t("modified_successfully"),
        type: "success",
        duration: 2000
      })
      cb && cb()
      await this.getList()
    },
    handlePropsEdit(row) {
      this.currentPropsEdit = row
    },
    async getList(showLoading = true) {
      this.resetTemp()
      if (showLoading) {
        this.listLoading = true
      }
      try {
        const nodeList = await nodeApi.getAll()
        const list = Array.from(await rgApi.resourcesDetailList()).filter(el => {
          return this.listQuery.title === '' || el.name.toLowerCase().indexOf(this.listQuery.title.toLowerCase()) !== -1
        })
        this.nodeFilterList = Array.from(new Set(list.map(el => el.node)))
        this.nodeList = nodeList.map(el => el.name)
        this.nodeDataList = nodeList
        this.rdList = Array.from(await rgApi.resourcesDefinitionsAll()).map(it => {
          return {
            'name': it.name,
            'resource_group_name': it.resource_group_name,
            'size': lodash.get(it, 'volumeDefinition[0].size_kib', '0'),
            'port': lodash.get(it, 'layer_data[0].data.port', ''),
            'state': it.flags && it.flags.find(item => item === 'DELETE') != null ? 'DELETING' : 'OK',
            'storage_pool_list': [lodash.get(it, 'volumeDefinition[0].props.StorPoolName', '')].filter(item => item !== ''),
            all_data: it
          }
        })
        this.spDataList = (await spApi.getAll())
        this.spNameList = Array.from(new Set(this.spDataList.map(it => it.storage_pool_name)))
        this.rdListFilter = Array.from(this.rdList).map(el => el.name)
        const offset = (this.listQuery.page - 1) * this.listQuery.limit
        this.list = list.slice(offset, offset + this.listQuery.limit)
        this.total = list.length
      } finally {
        if (showLoading) {
          this.listLoading = false
        } else {
          this.$message({
            showClose: true,
            message: 'Refreshed',
            type: 'success'
          })
        }
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
        node: '',
        method: 'Manual',
        auto_place: 2,
        diskless_on_remaining: false,
        storage_pool: '',
        network: ''
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
          if (this.temp.method === 'Manual') {
            const data = {
              'resource': {
                'name': this.temp.name,
                'node_name': this.temp.node,
                'props': {}
              }
            }
            if (this.temp.diskless_on_remaining) {
              data.resource.flags = ['DISKLESS']
            }
            if (this.temp.storage_pool !== '') {
              data.resource.props['StorPoolName'] = this.temp.storage_pool
            }
            if (this.temp.network !== '') {
              data.resource.props['PrefNic'] = this.temp.network
            }
            await rgApi.createResource(this.temp.name, this.temp.node, data)
          } else {
            const autoData = {
              'diskless_on_remaining': this.temp.diskless_on_remaining,
              'select_filter': {
                'place_count': this.temp.auto_place
              }
            }
            if (this.temp.storage_pool !== '') {
              autoData.select_filter.storage_pool = this.temp.storage_pool
            }
            await rgApi.autoPlaceResourcesDefinitions(this.temp.name, autoData)
          }

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
    async handleActivate(row) { // 运行
      await rgApi.activateResource(row.name, row.node)
      await this.getList()
    },
    async handleDeactivate(row) { // 暂停
      await rgApi.deactivateResource(row.name, row.node)
      await this.getList()
    },
    handleUpdate(row) {
      this.resetTemp()
      this.dialogStatus = 'update'
      const node = this.nodeDataList.find(el => el.name === row.node)
      if (node !== null) {
        this.preferenceNetWorkList = Array.from(node.net_interfaces.map(it => it.name))
      }
      this.temp.node = row.node
      this.temp.name = row.name
      this.temp.network = lodash.get(row, 'all_data.props.PrefNic', '')
      this.temp.storage_pool = lodash.get(row, 'all_data.props.StorPoolName', '')
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate(async(valid) => {
        if (valid) {
          const data = {
            'override_props': {},
            'delete_props': []
          }

          if (this.temp.network !== '') {
            data.override_props.PrefNic = this.temp.network
          } else {
            data.delete_props.push('PrefNic')
          }
          if (this.temp.storage_pool !== '') {
            data.override_props.StorPoolName = this.temp.storage_pool
          } else {
            data.delete_props.push('StorPoolName')
          }
          await rgApi.updateResource(this.temp.name, this.temp.node, data)
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
      await rgApi.deleteResource(row.name, row.node)
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
      const removeFun = async(row, index) => {
        return await new Promise((resolve, reject) => {
          let timeOut = 1000
          if (index === 0) {
            timeOut = 0
          }
          setTimeout(() => {
            rgApi.deleteResource(row.name, row.node).then(res => {
              resolve(res)
            }).catch(res => {
              reject(res)
            })
          }, timeOut)
        })
      }

      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await removeFun(row)
      }
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
    }
  }
}
</script>
