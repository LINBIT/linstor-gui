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
        :label="$t('id')"
        width="150px"
        align="center"
        prop="id"
        sortable
      />

      <el-table-column
        :label="$t('error_time')"
        align="center"
        prop="error_time"
      >
        <template slot-scope="{row}">
          <div>
            {{ row.error_time | parseTime }}
          </div>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('exception_message')"
        align="center"
        prop="exception_message"
      >
        <template slot-scope="{row}">
          <div>
            {{ row.exception_message | replaceText }}
          </div>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('table.actions')"
        align="center"
        width="320"
        class-name="small-padding fixed-width"
      >
        <template slot-scope="{ row }">
          <el-button type="primary" size="mini" @click="handleDetail(row)">
            {{ $t("detail") }}
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
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />
  </div>
</template>

<script>
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import * as rules from '@/utils/rules'
import * as logApi from '@/api/log'

export default {
  name: 'SPList',
  components: { Pagination },
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
      sizeOptions: rules.sizeOptions,
      multipleSelection: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      try {
        /* const list = [
          {
            'id': '5FE4B84B-00000-000000',
            'node_name': 'Node60',
            'error_time': 1608880033264,
            'filename': 'ErrorReport-5FE4B84B-00000-000000.log',
            'module': 'CONTROLLER',
            'version': '1.11.0',
            'peer': "RestClient(127.0.0.1; 'ReactorNetty/0.9.5.RELEASE')",
            'exception': 'ApiRcException',
            'exception_message': "Storage pool definition 'undefined' not found.",
            'origin_file': 'CtrlApiDataLoader.java',
            'origin_method': 'loadStorPoolDfn',
            'origin_line': 445
          }
        ]*/
        const list = (await logApi.list()).map(it => {
          it.id = it.filename.replaceAll('ErrorReport-', '').replaceAll('.log', '')
          return it
        }).filter(it => {
          return (this.listQuery.title === '' || it.id.toLowerCase().indexOf(this.listQuery.title.toLowerCase()) !== -1)
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
      this.listQuery.title = this.listQuery.titleTemp
      this.getList()
    },
    handleDetail(row) {
      this.$router.push(`/logDetail/${row.id}`)
    },

    async handleDelete(row, index) {
      await logApi.remove(row.id)
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
      const removeFun = async(row, index) => {
        return await new Promise((resolve, reject) => {
          let timeOut = 1000
          if (index === 0) {
            timeOut = 0
          }
          setTimeout(() => {
            logApi.remove(row.id).then(res => {
              resolve(res)
            }).catch(res => {
              reject(res)
            })
          }, timeOut)
        })
      }
      for (let i = 0; i < this.multipleSelection.length; i++) {
        const row = this.multipleSelection[i]
        await removeFun(row, i)
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
