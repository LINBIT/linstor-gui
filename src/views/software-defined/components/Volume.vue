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
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column
        :label="$t('volume_node')"
        width="150px"
        align="center"
        :filters="nodeFilterList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="node"
        sortable
      />
      <el-table-column
        :label="$t('volume_resource_name')"
        min-width="150px"
        align="center"
        :filters="resourceNameList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="resource"
        sortable
      />
      <el-table-column
        :label="$t('volume_sp_name')"
        width="150px"
        align="center"
        :filters="spNameList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="storage_pool"
        sortable
      />

      <el-table-column
        :label="$t('volume_device_name')"
        width="150px"
        align="center"
        sortable
      >
        <template slot-scope="{row}">
          {{ row.device_name | replaceDrbd }}
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('volume_allocated')"
        width="150px"
        align="center"
      >
        <template slot-scope="{row}">
          {{ row.allocated | formatBytes }}
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('volume_inuse')"
        class-name="status-col"
        width="130"
      >
        <template slot-scope="{row}">
          <el-tag type="info" effect="dark">
            {{ row.inUse }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('volume_state')"
        class-name="status-col"
        width="130"
      >
        <template slot-scope="{row}">
          <el-tag type="info" effect="dark">
            {{ row.state }}
          </el-tag>
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
            type="volume"
            :row-data="row"
            @handleSubmit="saveConfig"
            @handlePropsEdit="handlePropsEdit"
          />
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

    <el-dialog :visible.sync="nfs">
      <el-form
        ref="nfsDataForm"
        :rules="nfsRules"
        :model="nfsDataTemp"
        label-position="left"
        label-width="120px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item :label="$t('node')" prop="node">
          <el-select
            v-model="nfsDataTemp.node"
            class="filter-item"
            :placeholder="$t('please_select')"
            disabled
          >
            <el-option
              v-for="item in nodeList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('device_name')" prop="device_name">
          <el-select
            v-model="nfsDataTemp.device_name"
            class="filter-item"
            :placeholder="$t('please_select')"
            disabled
          >
            <el-option
              v-for="item in volumeDropdownList"
              :key="item"
              :label="item | replaceDrbd"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('client')" prop="client">
          <el-input v-model="nfsDataTemp.client" clearable />
        </el-form-item>

        <el-form-item :label="$t('parameters')" prop="parameters">
          <el-input v-model="nfsDataTemp.parameters" clearable />
        </el-form-item>

        <el-form-item v-if="nfsDataTemp.one_key_deploy" :label="$t('place_count')" prop="place_count">
          <el-input v-model="nfsDataTemp.place_count" type="number" min="1" max="32" clearable />
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="nfs = false">
          {{ $t("table.cancel") }}
        </el-button>
        <el-button
          type="primary"
          @click="createNFSData()"
        >
          {{ $t("table.confirm") }}
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="iSCSI">
      <el-form
        ref="iSCSIDataForm"
        :rules="iSCSIRules"
        :model="iSCSIDataTemp"
        label-position="left"
        label-width="120px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item :label="$t('node')" prop="node">
          <el-select
            v-model="iSCSIDataTemp.node"
            class="filter-item"
            :placeholder="$t('please_select')"
            disabled
          >
            <el-option
              v-for="item in nodeList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('device_name')" prop="device_name">
          <el-select
            v-model="iSCSIDataTemp.device_name"
            class="filter-item"
            :placeholder="$t('please_select')"
            disabled
          >
            <el-option
              v-for="item in volumeDropdownList"
              :key="item"
              :label="item | replaceDrbd"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('LUN')" prop="LUN">
          <el-input v-model="iSCSIDataTemp.LUN" type="number" min="1" max="32" clearable />
        </el-form-item>

        <el-form-item :label="$t('IP')" prop="IP">
          <el-select
            v-model="iSCSIDataTemp.IP"
            class="filter-item"
            :placeholder="$t('please_select')"
            clearable
          >
            <el-option
              v-for="item in networkDropdownList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('port')" prop="port">
          <el-input v-model="iSCSIDataTemp.port" clearable />
        </el-form-item>

        <el-form-item :label="$t('IQN')" prop="IQN">
          <div style="display: flex;">
            <el-input v-model="iSCSIDataTemp.IQNInput1" placeholder="1990-01" style="width: 140px;" clearable>
              <template slot="prepend">iqn.</template>
            </el-input>
            <el-input v-model="iSCSIDataTemp.IQNInput2" placeholder="com.mistor" style="width: 140px;" clearable>
              <template slot="prepend">.</template>
            </el-input>
            <el-input v-model="iSCSIDataTemp.IQNInput3" placeholder="target01" style="width: 140px;" clearable>
              <template slot="prepend">:</template>
            </el-input>
          </div>
        </el-form-item>

        <el-form-item :label="$t('读写模式')">
          <el-radio-group v-model="iSCSIDataTemp.demo_mode_write_protect">
            <el-radio :label="false">{{ $t('只读') }}</el-radio>
            <el-radio :label="true">{{ $t('读写') }}</el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="iSCSI = false">
          {{ $t("table.cancel") }}
        </el-button>
        <el-button
          type="primary"
          @click="createISCSIData()"
        >
          {{ $t("table.confirm") }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as rgApi from '@/api/rg'
import * as pluginApi from '@/api/plugin'
import * as rules from '@/utils/rules'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import PropertyEditor from '@/components/PropertyEditor'
import lodash from 'lodash'
export default {
  name: 'Volume',
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
      resourceNameList: [], // 磁盘筛选
      textMap: {
        update: this.$t('edit'),
        create: this.$t('create')
      },
      iSCSIDataTemp: {
        node: '',
        demo_mode_write_protect: false,
        device_name: '',
        IQN: '',
        LUN: '1',
        IP: '',
        IQNInput1: '',
        IQNInput2: '',
        IQNInput3: '',
        port: 3260
      },
      nfsDataTemp: {
        node: '',
        device_name: '',
        client: '',
        parameters: ''
      },
      iSCSI: false,
      nfs: false,
      networkDropdownList: [],
      volumeDropdownList: [],
      nodeList: [],
      pluginList: [],
      nfsRules: {
        node: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        device_name: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        client: [
          { required: true, message: this.$t('is_required'), trigger: 'blur' }
        ]
      },
      iSCSIRules: {
        node: [{ required: true, message: this.$t('nis_required'), trigger: 'change' }],
        device_name: [{ required: true, message: this.$t('is_required'), trigger: 'change' }],
        IQN: [{ required: true, validator: this.handleIQN, trigger: 'blur' }],
        LUN: [{ required: true, validator: this.$t('is_required'), trigger: 'blur' }],
        IP: [{ required: true, message: this.$t('is_required'), trigger: 'change' }],
        port: [{ required: true, validator: rules.checkPort, trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async saveConfig(data, cb) {
      await rgApi.updateVolumes(this.currentPropsEdit.resource, this.currentPropsEdit.node, this.currentPropsEdit.volume_number, data)
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
      console.log(row)
      this.currentPropsEdit = row
    },

    handleIQN(rule, value, callback) {
      if (!(this.iSCSIDataTemp.IQNInput1 && this.iSCSIDataTemp.IQNInput2 && this.iSCSIDataTemp.IQNInput3)) {
        callback(new Error(this.$t('is_required')))
      } else {
        callback()
      }
    },
    async getList() {
      this.listLoading = true
      try {
        const pluginList = []
        this.pluginList = pluginList
        const list = Array.from(await rgApi.resourcesList()).flatMap(it => {
          return it.volumes.map(res => {
            res.info = it
            return res
          })
        })
          .map(it => {
            const disk_state = lodash.get(it, 'state.disk_state', '')
            if (disk_state === 'Diskless') {
              if (it.info.flags.includes('TIE_BREAKER')) {
                return null
              }
            }
            return {
              'node': it.info.node_name,
              'resource': it.info.name,
              volume_number: it.volume_number,
              'usage': 'Unused',
              'storage_pool': it.storage_pool_name === 'DfltDisklessStorPool' ? '自动分配' : it.storage_pool_name,
              'device_name': it.device_path,
              'allocated': it.allocated_size_kib,
              'props': it.props,
              'inUse': lodash.get(it, 'info.state.in_use', false) ? 'InUse' : 'Unused',
              'state': lodash.get(it, 'state.disk_state', ''),
              canShare: lodash.get(it, 'info.state.in_use', false) === false &&
                lodash.get(pluginList.find(el => el.nodeName === it.info.node_name && el.volumes.name === it.info.name), 'inuse', false) === false
            }
          }).filter(it => it !== null).filter(it => {
            return (this.listQuery.title === '' || it.resource.toLowerCase().indexOf(this.listQuery.title.toLowerCase()) !== -1)
          })
        const offset = (this.listQuery.page - 1) * this.listQuery.limit
        this.list = list.slice(offset, offset + this.listQuery.limit)
        this.total = list.length
        this.nodeFilterList = Array.from(new Set(list.map(el => el.node)))
        this.spNameList = Array.from(new Set(list.map(el => el.storage_pool)))
        this.resourceNameList = Array.from(new Set(list.map(el => el.resource)))
      } finally {
        this.listLoading = false
      }
    },
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.title = this.listQuery.titleTemp
      this.getList()
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    },
    filterHandlerPreference(value, row, column) {
      return row.props.PrefNic === value
    },
    handleCreate(type, rowData) {
      this[type] = true
      this.volumeDropdownList = [rowData.device_name]
      this[`${type}DataTemp`] = { ...this[`${type}DataTemp`], ...rowData }
      if (type === 'iSCSI') {
        this.networkDropdownList = ['0.0.0.0']
        this.networkDropdownList.push(...Array.from(new Set(this.pluginList.filter(el => el.nodeName === this.iSCSIDataTemp.node && el.inuse === false).flatMap(el => el.node.node.net_interfaces)
          .map(it => it.address))))
      }
    },
    createISCSIData() {
      this.$refs['iSCSIDataForm'].validate(async valid => {
        if (valid) {
          const data = this.iSCSIDataTemp
          await pluginApi.createIscsi(data.node, {
            'vol': data.device_name.split('/')[2],
            'initiator_wwn': `iqn.${data.IQNInput1}.${data.IQNInput2}:${data.IQNInput3}`,
            'lun': data.LUN,
            'ip': data.IP,
            'port': data.port,
            'demo_mode_write_protect': data.demo_mode_write_protect ? '0' : null
          })
          this.$notify({
            title: this.$t('success'),
            message: this.$t('added_successfully'),
            type: 'success',
            duration: 2000
          })
          this.iSCSI = false
          await this.getList()
        }
      })
    },
    createNFSData() {
      this.$refs['nfsDataForm'].validate(async valid => {
        if (valid) {
          const data = this.nfsDataTemp
          let param = data.parameters.split(',')
          if (param[0] === '') {
            param = []
          }
          await pluginApi.createNfs(data.node, {
            'host': data.client,
            'drive': data.device_name.split('/')[2],
            'options': param
          })
          this.$notify({
            title: this.$t('success'),
            message: this.$t('added_successfully'),
            type: 'success',
            duration: 2000
          })
          this.nfs = false
          await this.getList()
        }
      })
    }
  }
}
</script>
