<template>
  <div class="app-container">
    <h3>{{ $t('log_detail') }}</h3>

    <div class="code-block">
      <pre>
        <code>
          {{ detail | replaceText }}
        </code>
      </pre>
    </div>
  </div>
</template>

<script>
import waves from '@/directive/waves' // waves directive
import * as logApi from '@/api/log'

export default {
  name: 'SPList',
  directives: { waves },
  filters: {

  },
  data() {
    return {
      detail: ''
    }
  },
  async mounted() {
    const id = this.$route.params.id
    const result = await logApi.detail(id)
    this.detail = result[0].text
  }
}
</script>

<style>
.demo-table-expand {
  font-size: 0;
}

.code-block {
  background-color: #f5f7fa;
  border-radius: 5px;
  padding: 20px;
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
