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
        :label="$t('rg_name')"
        width="150px"
        align="center"
        :filters="spNameList.map(el => ({ text: el, value: el }))"
        :filter-method="filterHandler"
        prop="name"
        sortable
      />

      <el-table-column
        :label="$t('place_count')"
        width="150px"
        align="center"
      >
        <template slot-scope="{ row }">
          <span>{{ row.place_count }}</span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('vg_sp')"
        width="300"
        align="center"
      >
        <template slot-scope="{ row }">
          <span>{{ (row.storage_pool_list || []).length > 0 ? row.storage_pool_list.join(',') : $t('自动') }}</span>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('data_copy_mode')"
        align="center"
      >
        <template slot-scope="{ row }">
          <el-tag v-if="row.data_copy_mode === 'A'" effect="plain">
            {{ $t("async") }}
          </el-tag>
          <el-tag v-if="row.data_copy_mode === 'C'" effect="plain">
            {{ $t("sync") }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('diskless')"
        align="center"
      >
        <template slot-scope="{ row }">
          <el-tag v-if="row.diskless_on_remaining" effect="plain">
            {{ $t("yes") }}
          </el-tag>
          <el-tag v-else effect="plain">
            {{ $t("no") }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('description')"
        align="center"
      >
        <template slot-scope="{ row }">
          <span>{{ row.description }}</span>
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
        <el-form-item :label="$t('rg_name')" prop="name">
          <el-input v-model="temp.name" :disabled="dialogStatus === 'update'" clearable />
        </el-form-item>
        <el-form-item :label="$t('data_copy_mode')" prop="data_copy_mode">
          <el-radio-group v-model="temp.data_copy_mode" clearable>
            <el-radio label="A">{{ $t('async') }}</el-radio>
            <el-radio label="C">{{ $t('sync') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('diskless')" prop="diskless_on_remaining">
          <el-radio-group v-model="temp.diskless_on_remaining" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('place_count')" prop="place_count">
          <el-input v-model="temp.place_count" type="number" min="0" max="32" clearable />
        </el-form-item>

        <el-form-item :label="$t('description')" prop="description">
          <el-input
            v-model="temp.description"
            clearable
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-form-item :label="$t('sp_name_list')">
          <el-select
            v-model="temp.storage_pool_list"
            class="filter-item"
            placeholder="Please Select"
            clearable
            multiple
          >
            <el-option
              v-for="item in spNameList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('layers')">
          <el-select
            v-model="temp.layer_list"
            class="filter-item"
            placeholder="Please Select"
            multiple
            clearable
          >
            <el-option
              v-for="item in layerList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('providers')">
          <el-select
            v-model="temp.provider_list"
            class="filter-item"
            placeholder="Please Select"
            clearable
            multiple
          >
            <el-option
              v-for="item in providerList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="dialogStatus === 'create' && temp.place_count > 0"
          :label="$t('one_key_deploy')"
          prop="one_key_deploy"
        >
          <el-radio-group v-model="temp.one_key_deploy" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="dialogStatus === 'create' && temp.one_key_deploy" :label="$t('rd_name')" prop="rd_name">
          <el-input v-model="temp.rd_name" clearable />
        </el-form-item>

        <el-form-item
          v-if="dialogStatus === 'create' && temp.one_key_deploy"
          :label="$t('volume_size')"
          prop="volume_size"
        >
          <el-input v-model="temp.volume_size" clearable>
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

        <el-form-item
          v-if="dialogStatus === 'create' && temp.one_key_deploy"
          :label="$t('definition_only')"
          prop="definition_only"
        >
          <el-radio-group v-model="temp.definition_only" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-collapse v-model="advancedActive">
          <el-collapse-item title="Advanced" name="1">
            <el-form-item :label="$t('replicas_on_same')" prop="replicas_on_same">
              <el-select
                v-model="temp.replicas_on_same"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Please input"
              >
                <el-option
                  v-for="item in []"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="$t('do_not_place_with_regex')" prop="do_not_place_with_regex">
              <el-input v-model="temp.do_not_place_with_regex" clearable />
            </el-form-item>

            <el-form-item :label="$t('replicas_on_same')" prop="replicas_on_same">
              <el-select
                v-model="temp.replicas_on_different"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Please input"
              >
                <el-option
                  v-for="item in []"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="$t('do_not_place_with')" prop="do_not_place_with">
              <el-select
                v-model="temp.do_not_place_with"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="Please input"
              >
                <el-option
                  v-for="item in []"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item :label="$t('do_not_place_with_rege')" prop="do_not_place_with_rege">
              <el-input v-model="temp.do_not_place_with_rege" clearable />
            </el-form-item>

          </el-collapse-item>
        </el-collapse>
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
        <el-form-item :label="$t('rd_name')" prop="rd_name">
          <el-input v-model="temp.rd_name" clearable />
        </el-form-item>

        <el-form-item
          :label="$t('volume_size')"
          prop="volume_size"
        >
          <el-input v-model="temp.volume_size" clearable>
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

        <el-form-item
          :label="$t('definition_only')"
          prop="definition_only"
        >
          <el-radio-group v-model="temp.definition_only" clearable>
            <el-radio :label="true">{{ $t('yes') }}</el-radio>
            <el-radio :label="false">{{ $t('no') }}</el-radio>
          </el-radio-group>
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
import * as spApi from '@/api/sp'
import * as rgApi from '@/api/rg'
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import * as rules from '@/utils/rules'
import i18n from '@/lang'
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
      spNameList: [],
      layerList: [ // layers选择项
        'cache',
        'storage',
        'drdb',
        'nvme',
        'luks',
        'writechache',
        'openflex',
        'exos'
      ],
      providerList: [ // Provider选择项
        'LVM',
        'LVM_THIN',
        'ZFS',
        'ZFS_THIN',
        'DISKLESS',
        'FILE',
        'FILE_THIN',
        'SPDK',
        'OPENFLEX_TARGET',
        'EXOS'
      ],
      spPreferenceList: [], // 优先网络筛选
      temp: {
        name: '',
        description: '',
        place_count: 2,
        do_not_place_with: [],
        do_not_place_with_regex: '',
        replicas_on_same: [],
        replicas_on_different: [],
        storage_pool_list: [],
        layer_list: [],
        provider_list: [],
        diskless_on_remaining: false,
        one_key_deploy: false, // 一键部署
        rd_name: '',
        volume_size: '',
        size_unit: 'GiB',
        definition_only: false,
        data_copy_mode: 'C' // 数据复制模式
      },
      currentPropsEdit: null,
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: this.$t('edit'),
        create: this.$t('create')
      },
      dialogPvVisible: false,
      pvData: [],
      sizeOptions: rules.sizeOptions,
      rules: {
        name: [
          { required: true, message: this.$t('is_required'), trigger: 'blur' }
        ],
        data_copy_mode: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        diskless_on_remaining: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        one_key_deploy: [
          { required: true, message: this.$t('is_required'), trigger: 'change' }
        ],
        rd_name: [
          { required: true, message: this.$t('rd_name') + this.$t('is_required'), trigger: 'blur' }
        ],
        volume_size: [
          { required: true, trigger: 'blur', message: i18n.t('volume_size_range') }
        ],
        definition_only: [
          { required: true }
        ],
        place_count: [{ required: true, message: this.$t('is_required'), trigger: 'blur' }]
      },
      multipleSelection: [],
      advancedActive: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async saveConfig(data, cb) {
      await rgApi.update(this.currentPropsEdit.name, data)
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
        const list = Array.from(await rgApi.rgList()).filter(it => {
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
        description: '',
        place_count: 2,
        do_not_place_with: [],
        replicas_on_different: [],
        replicas_on_same: [],
        do_not_place_with_regex: '',
        storage_pool_list: [],
        provider_list: [],
        layer_list: [],
        diskless_on_remaining: false,
        one_key_deploy: false,
        rd_name: '',
        volume_size: '',
        size_unit: 'GiB',
        definition_only: false,
        data_copy_mode: 'C'
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
            'name': this.temp.name,
            'description': this.temp.description,
            'select_filter': {
              'not_place_with_rsc': this.temp.do_not_place_with,
              'not_place_with_rsc_regex': this.temp.do_not_place_with_regex,
              'replicas_on_same': this.temp.replicas_on_same,
              'replicas_on_different': this.temp.replicas_on_different,
              'diskless_on_remaining': this.temp.diskless_on_remaining,
              'storage_pool_list': this.temp.storage_pool_list,
              'layer_stack': this.temp.layer_list,
              'provider_list': this.temp.provider_list,
              'place_count': this.temp.place_count
            }
          }
          await rgApi.create(data)
          await rgApi.createVolume(this.temp.name, {})

          await rgApi.update(
            this.temp.name, {
              'override_props': {
                'DrbdOptions/Net/protocol': this.temp.data_copy_mode,
                'DrbdOptions/PeerDevice/c-max-rate': '4194304'
              }
            }
          )

          if (this.temp.one_key_deploy) {
            const swapData = {
              'resource_definition_name': this.temp.rd_name,
              'resource_definition_external_name': null,
              'volume_sizes': [rules.convertRoundUp(this.temp.size_unit, this.temp.volume_size)],
              'definitions_only': this.temp.definition_only
            }
            await rgApi.createSpawn(this.temp.name, swapData)
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
      this.temp = {
        name: row.name,
        rd_name: '',
        volume_size: '0',
        size_unit: 'GiB',
        definition_only: false
      }
      this.dialogPvVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    deploy() {
      this.$refs['dataForm'].validate(async valid => {
        if (valid) {
          const swapData = {
            'resource_definition_name': this.temp.rd_name,
            'resource_definition_external_name': null,
            'volume_sizes': [rules.convertRoundUp(this.temp.size_unit, this.temp.volume_size)],
            'definitions_only': this.temp.definition_only
          }
          await rgApi.createSpawn(this.temp.name, swapData)
          this.$notify({
            title: this.$t('success'),
            message: this.$t('added_successfully'),
            type: 'success',
            duration: 2000
          })
          this.dialogPvVisible = false
          await this.getList()
        }
      })
    },
    handleUpdate(row) {
      console.log(row)
      this.resetTemp()
      this.temp = {
        name: row.name,
        description: row.description,
        data_copy_mode: row.data_copy_mode,
        diskless_on_remaining: row.diskless_on_remaining,
        storage_pool_list: row.storage_pool_list,
        layer_list: row.layer_list || [],
        provider_list: row.provider_list || [],
        one_key_deploy: row.one_key_deploy,
        rd_name: row.rd_name,
        volume_size: row.volume_size,
        definition_only: row.definition_only,
        place_count: row.place_count,
        do_not_place_with: row.do_not_place_with,
        replicas_on_same: row.replicas_on_same,
        replicas_on_different: row.replicas_on_different,
        do_not_place_with_regex: row.do_not_place_with_regex

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
            'description': this.temp.description,
            'override_props': {
              'DrbdOptions/Net/protocol': this.temp.data_copy_mode,
              'DrbdOptions/PeerDevice/c-max-rate': '4194304'
            },
            'select_filter': {
              'place_count': this.temp.place_count,
              'not_place_with_rsc': this.temp.do_not_place_with,
              'not_place_with_rsc_regex': this.temp.do_not_place_with_regex,
              'replicas_on_same': this.temp.replicas_on_same,
              'replicas_on_different': this.temp.replicas_on_different,
              'storage_pool_list': this.temp.storage_pool_list,
              'provider_list': this.temp.provider_list,
              'layer_stack': this.temp.layer_list,
              'diskless_on_remaining': this.temp.diskless_on_remaining
            }
          }
          await rgApi.update(this.temp.name, data)
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
      await rgApi.remove(row.name)
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
            rgApi.remove(name).then(res => {
              resolve(res)
            }).catch(res => {
              reject(res)
            })
          }, timeOut)
        })
      }
      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await removeFun(row.name, i)
      }
      this.$notify({
        title: this.$t('success'),
        message: this.$t('deleted_successfully'),
        type: 'success',
        duration: 2000
      })
      await this.getList()
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
</style>
