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
      />

      <el-table-column
        :label="$t('name')"
        width="150px"
        align="center"
        :filters="spNameList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="name"
        sortable
      />

      <el-table-column
        :label="$t('resource_group_name')"
        align="center"
        prop="resource_group_name"
      >
        <template slot-scope="{ row }">
          <span>{{ row.resource_group_name == 'DfltRscGrp' ? $t('无'):row.resource_group_name }} </span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('rd_size')"
        align="center"
      >
        <template slot-scope="{ row }">
          <span>{{ row.size | formatBytes }} </span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('rd_port')"
        align="center"
        prop="port"
      />

      <el-table-column
        :label="$t('rd_state')"
        align="center"
      >
        <template slot-scope="{ row }">
          <el-tag type="info" effect="plain">
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
        <template slot-scope="{ row, $index }">
          <PropertyEditor
            type="resource-definition"
            :row-data="row"
            @handleSubmit="saveConfig"
            @handlePropsEdit="handlePropsEdit"
          />
          <el-button type="success" size="mini" @click="handleDeploy(row)">
            {{ $t("one_key_deploy") }}
          </el-button>
          <el-button type="primary" :disabled="readonly" size="mini" @click="handleUpdate(row)">
            {{ $t("edit") }}
          </el-button>
          <el-popconfirm
            :title="$t('delete_confirm')"
            style="margin-left: 10px;"
            :confirm-button-text="$t('yes')"
            :cancel-button-text="$t('no')"
            @onConfirm="handleDelete(row, $index)"
          >
            <el-button slot="reference" size="mini" type="danger" :disabled="readonly">
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
        <el-form-item :label="$t('rd_rg_name')" prop="rg_name">
          <el-select v-model="temp.rg_name" :placeholder="$t('please_select')" clearable>
            <el-option
              v-for="item in rgList"
              :key="item.name"
              :label="item.name == 'DfltRscGrp' ? $t('无') : item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('rd_name')" prop="name">
          <el-input v-model="temp.name" :disabled="dialogStatus === 'update'" clearable />
        </el-form-item>

        <el-form-item :label="$t('rg_size')" prop="size">
          <el-input v-model="temp.size" clearable>
            <el-select slot="append" v-model="temp.size_unit" :placeholder="$t('please_select')" clearable style="width: 100px;">
              <el-option-group
                v-for="(group,index) in sizeOptions"
                :key="index"
                :label="group.label"
              >
                <el-option
                  v-for="(item) in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.label"
                />
              </el-option-group>
            </el-select>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('data_copy_mode')" prop="data_copy_mode">
          <el-radio-group v-model="temp.data_copy_mode" clearable>
            <el-radio label="A">{{ $t('async') }}</el-radio>
            <el-radio label="C">{{ $t('sync') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('sp_name_list')" prop="'sp_name">
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

        <el-form-item v-if="dialogStatus === 'create'" :label="$t('one_key_deploy')" prop="one_key_deploy">
          <el-radio-group v-model="temp.one_key_deploy" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="temp.one_key_deploy" :label="$t('place_count')" prop="place_count">
          <el-input v-model="temp.place_count" type="number" min="1" max="32" clearable />
        </el-form-item>

        <el-form-item v-if="temp.one_key_deploy" :label="$t('diskless')" prop="diskless_on_remaining">
          <el-radio-group v-model="temp.diskless_on_remaining" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
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

    <!-- 一键部署 -->
    <el-dialog :visible.sync="dialogPvVisible" :title="$t('one_key_deploy')">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="120px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item :label="$t('diskless')" prop="diskless_on_remaining">
          <el-radio-group v-model="temp.diskless_on_remaining" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('place_count')" prop="place_count">
          <el-input v-model="temp.place_count" type="number" min="1" max="32" clearable />
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogPvVisible = false">
          {{ $t("table.cancel") }}
        </el-button>
        <el-button
          type="primary"
          @click="deploy()"
        >
          {{ $t("table.confirm") }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as rgApi from '@/api/rg'
import * as spApi from '@/api/sp'
import * as rules from '@/utils/rules'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import PropertyEditor from '@/components/PropertyEditor'
import lodash from 'lodash'

export default {
  name: 'RDList',
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
      rgList: [], // 组列表
      spNameList: [], // 名称筛选
      temp: {
        name: '',
        rg_name: '',
        data_copy_mode: 'C',
        place_count: '1', // 自动分配副本数
        one_key_deploy: false, // 一键部署
        diskless_on_remaining: false,
        size: '0',
        size_unit: 'GiB',
        storage_pool: ''
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
        name: [
          { required: true, message: this.$t('name_required'), trigger: 'blur' }
        ],
        data_copy_mode: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        one_key_deploy: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        place_count: [
          { required: true, validator: (rule, value, callback) => {
            if (this.temp.one_key_deploy || false) {
              if (this.temp.place_count <= 1 && this.temp.place_count > 100) {
                callback(new Error(this.$t('is_required')))
                return
              }
            }
            callback()
          }, trigger: 'change' }
        ],
        diskless_on_remaining: [
          { required: true, validator: (rule, value, callback) => {
            if (this.temp.one_key_deploy || false) {
              if (this.temp.diskless_on_remaining === null) {
                callback(new Error(this.$t('diskless_on_remaining')))
                return
              }
            }
            callback()
          }, trigger: 'blur' }
        ]
      },
      multipleSelection: [],
      sizeOptions: rules.sizeOptions,
      readonly: false
    }
  },
  computed: {
    ...mapGetters([
      'roles'
    ])
  },
  watch: {
    'temp.rg_name'(val) {
      console.log(val, 'val')
      if (this.dialogStatus === 'create') {
        const selectedRG = this.rgList.find(el => el.name === val)
        if (selectedRG) {
          this.temp.data_copy_mode = selectedRG.data_copy_mode
          this.temp.storage_pool = selectedRG.storage_pool_list[0] || ''
          this.temp.diskless_on_remaining = selectedRG.diskless_on_remaining
          this.temp.place_count = selectedRG.place_count
        } else {
          this.temp.data_copy_mode = 'C'
          this.temp.storage_pool = ''
          this.temp.place_count = '1'
          this.temp.diskless_on_remaining = false
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
      await rgApi.updateResourcesDefinitions(this.currentPropsEdit.name, data)
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
    async getList() {
      this.resetTemp()
      this.listLoading = true
      try {
        this.rgList = Array.from(await rgApi.rgList({}, false))
        console.log(this.rgList)
        const list = Array.from(await rgApi.resourcesDefinitionsAll()).map(it => {
          return {
            'name': it.name,
            'resource_group_name': it.resource_group_name,
            'size': lodash.get(it, 'volumeDefinition[0].size_kib', '0'),
            'port': lodash.get(it, 'layer_data[0].data.port', ''),
            'storage_pool': lodash.get(it, 'volumeDefinition[0].props.StorPoolName', ''),
            'state': it.flags.find(item => item === 'DELETE') != null ? 'DELETING' : 'OK',
            'data_copy_mode': it.props['DrbdOptions/Net/protocol'] || 'C',
            'props': it.props,
            all_data: it
          }
        })
          .filter(it => {
            return (this.listQuery.title === '' || it.name.toLowerCase().indexOf(this.listQuery.title.toLowerCase()) !== -1)
          })
        this.spNameList = Array.from(new Set(Array.from(await spApi.getAll()).filter(el => el.storage_pool_name !== 'DfltDisklessStorPool').map(el => el.storage_pool_name)))
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
        rg_name: '',
        data_copy_mode: 'C',
        place_count: '1', // 自动分配副本数
        one_key_deploy: false, // 一键部署
        diskless_on_remaining: false,
        size: '0',
        size_unit: 'GiB',
        storage_pool: ''
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
            'resource_definition': {
              'name': this.temp.name,
              'props': {
                'DrbdOptions/Net/protocol': this.temp.data_copy_mode,
                'DrbdOptions/PeerDevice/c-max-rate': '4194304'
              },
              'resource_group_name': this.temp.rg_name === '' ? 'DfltRscGrp' : this.temp.rg_name,
              'volume_definitions': []
            }
          }
          await rgApi.createResourcesDefinitions(data)

          if (this.temp.size !== '' && this.temp.size !== '') {
            const d = {
              'volume_definition': {}
            }
            if (this.temp.size !== '') {
              d.volume_definition.size_kib = rules.convertRoundUp(this.temp.size_unit, this.temp.size)
            }
            if (this.temp.storage_pool !== '') {
              d.volume_definition.props = {
                'StorPoolName': this.temp.storage_pool
              }
            }
            await rgApi.createVolumeDefinitions(this.temp.name, d)
          }

          if (this.temp.one_key_deploy) {
            const autoData = {
              'diskless_on_remaining': this.temp.diskless_on_remaining,
              'select_filter': {
                'place_count': this.temp.place_count
              }
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
    handleDeploy(row) {
      this.resetTemp()
      this.temp.name = row.name
      this.dialogPvVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    deploy() {
      this.$refs['dataForm'].validate(async(valid) => {
        if (valid) {
          const autoData = {
            'diskless_on_remaining': this.temp.diskless_on_remaining,
            'select_filter': {
              'place_count': this.temp.place_count
            }
          }
          await rgApi.autoPlaceResourcesDefinitions(this.temp.name, autoData)
          this.$notify({
            title: this.$t('success'),
            message: this.$t('updated_successfully'),
            type: 'success',
            duration: 2000
          })
          this.dialogPvVisible = false
          await this.getList()
        }
      })
    },
    handleUpdate(row) {
      this.resetTemp()
      const data = this.$filter.formatBytes(row.size).split(' ')
      this.temp = {
        name: row.name,
        rg_name: row.resource_group_name,
        data_copy_mode: row.data_copy_mode,
        storage_pool: row.storage_pool,
        size_unit: data[1],
        size: data[0],
        row: row
      }
      console.log(this.temp)
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
              'DrbdOptions/Net/protocol': this.temp.data_copy_mode,
              'DrbdOptions/PeerDevice/c-max-rate': '4194304'
            },
            'resource_group': this.temp.rg_name === '' ? 'DfltRscGrp' : this.temp.rg_name
          }
          await rgApi.updateResourcesDefinitions(this.temp.name, data)
          if (this.temp.row.all_data.volumeDefinition.length > 0) {
            const d = {
              'size_kib': 0,
              'override_props': {},
              'delete_props': []
            }
            if (this.temp.size !== '') {
              d.size_kib = rules.convertRoundUp(this.temp.size_unit, this.temp.size)
            } else {
              d.size_kib = 0
            }
            if (this.temp.storage_pool !== '') {
              d.override_props = { 'StorPoolName': this.temp.storage_pool }
            } else {
              d.delete_props = ['StorPoolName']
            }
            await rgApi.updateVolumeDefinitions(this.temp.name, this.temp.row.all_data.volumeDefinition[0].volume_number, d)
          } else {
            if (this.temp.size !== '' && this.temp.size !== '') {
              const d = {
                'volume_definition': {}
              }
              if (this.temp.size !== '') {
                d.volume_definition.size_kib = rules.convertRoundUp(this.temp.size_unit, this.temp.size)
              }
              if (this.temp.storage_pool !== '') {
                d.volume_definition.props = {
                  'StorPoolName': this.temp.storage_pool
                }
              }
              await rgApi.createVolumeDefinitions(this.temp.name, d)
            }
          }

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
      await rgApi.removeResourcesDefinitions(row.name)
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
      const removeFun = async(name, index) => {
        return await new Promise((resolve, reject) => {
          let timeOut = 1000
          if (index === 0) {
            timeOut = 0
          }
          setTimeout(() => {
            rgApi.removeResourcesDefinitions(name).then(res => {
              resolve(res)
            }).catch(res => {
              reject(res)
            })
          }, timeOut)
        })
      }

      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await removeFun(row.name)
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
    }
  }
}
</script>

<style>
.demo-table-expand {
  font-size: 0;
}

.demo-table-expand label {
  width: 90px;
  color: #99a9bf;
}

.demo-table-expand .el-form-item {
  margin-right: 0;
  margin-bottom: 0;
  width: 50%;
}

.input-with-select .el-input-group__prepend {
  background-color: #fff;
}
</style>
