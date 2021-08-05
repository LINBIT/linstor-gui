<template>
  <div class="dashboard-editor-container">
    <panel-group :panel-data="panelData" />

    <el-row :gutter="32">
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <div>{{ $t('node_num') }}</div>
          <pie-chart ref="node" :char-data="nodeData" :title="$t('node_num')" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <div>{{ $t('resource_num') }}</div>
          <pie-chart ref="resource" :char-data="resourceData" :title="$t('resource_num')" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <div>{{ $t('volume_num') }}</div>
          <pie-chart ref="volume" :char-data="volumeData" :title="$t('volume_num')" />
        </div>
      </el-col>
    </el-row>

    <el-row style="background:#fff;padding:16px 16px 0;margin-bottom:32px;">
      <div>{{ $t('disk_creation_record') }}</div>
      <line-chart ref="line" :chart-data="lineChartData" />
    </el-row>

    <el-row :gutter="32">

      <el-col :xs="24" :sm="24" :lg="24">

        <div class="chart-wrapper">
          <div>{{ $t('storage_pool_error_statistics') }}</div>
          <div class="selector">
            <el-radio-group v-model="barchart" @change="hanldeChange">
              <el-radio-button :label="$t('node_num')" />
              <el-radio-button :label="$t('sp')" />
            </el-radio-group>
          </div>
          <bar-chart ref="bar" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import _ from 'lodash'
import parsePrometheusTextFormat from 'parse-prometheus-text-format'
import PanelGroup from './components/PanelGroup'
import LineChart from './components/LineChart'
import PieChart from './components/PieChart'
import BarChart from './components/BarChart'
import * as nodeApi from '@/api/node'
import * as rgApi from '@/api/rg'

export default {
  name: 'DashboardAdmin',
  components: {
    PanelGroup,
    LineChart,
    PieChart,
    BarChart
  },
  data() {
    return {
      panelData: {
        node_num: 0,
        resource_num: 0,
        volume_num: 0,
        error_num: 0
      },
      lineChartData: [0, 0, 0, 0, 0, 0, 0],
      // vinitChart
      // nodeChartData: ['OFFLINE', 'CONNECTED', 'ONLINE', 'VERSION_MISMATCH', 'FULL_SYNC_FAILED', 'AUTHENTICATION_ERROR', 'UNKNOWN', 'HOSTNAME_MISMATCH', 'OTHER_CONTROLLER', 'AUTHENTICATED', 'NO_STLT_CONN'],
      nodeData: [{ value: 0, name: 'OFFLINE' }, { value: 0, name: 'CONNECTED' }],
      // -1="unknown state", 0="secondary", 1="primary"
      resourceData: [{ value: 2, name: 'unknown state' }, { value: 3, name: 'secondary' }, { value: 1, name: 'primary' }],
      volumeData: [{ value: 22, name: 'UpToDate' }, { value: 25, name: 'Created' }],
      bar1: { data: [], xValues: [] },
      bar2: { data: [], xValues: [] },
      barChatData: { data: [], xValues: [] },
      barchart: this.$t('node_num')
    }
  },
  mounted() {
    this.update()
  },
  methods: {
    async update() {
      const self = this
      const convert = {
        'linstor_node_state': (d) => {
          const c = {
            0: self.$t('OFFLINE'),
            1: self.$t('CONNECTED'),
            2: self.$t('ONLINE'),
            3: self.$t('VERSION_MISMATCH'),
            4: self.$t('FULL_SYNC_FAILED'),
            5: self.$t('AUTHENTICATION_ERROR'),
            6: self.$t('UNKNOWN'),
            7: self.$t('HOSTNAME_MISMATCH'),
            8: self.$t('OTHER_CONTROLLER'),
            9: self.$t('AUTHENTICATED'),
            10: self.$t('NO_STLT_CONN')
          }
          try {
            return d.metrics.map(it => {
              return {
                node: it.labels.node,
                state: parseInt(it.value),
                stateStr: c[parseInt(it.value).toString()]
              }
            })
          } catch (e) {
            return []
          }
        },
        'linstor_resource_state': (d) => {
          const c = { '-1': self.$t('unknown state'), '0': self.$t('secondary'), '1': self.$t('primary') }
          try {
            return d.metrics.map(it => (
              {
                nnode: it.labels.node,
                state: parseInt(it.value),
                stateStr: c[parseInt(it.value).toString()]
              }
            ))
          } catch (e) {
            return []
          }
        },
        'linstor_volume_state': (d) => {
          const c = {
            '1': self.$t('UpToDate'),
            '2': self.$t('Created'),
            '3': self.$t('Attached'),
            '4': self.$t('Diskless'),
            '5': self.$t('Inconsistent'),
            '6': self.$t('Failed'),
            '7': self.$t('To: Creating'),
            '8': self.$t('To: Attachable'),
            '9': self.$t('To: Attaching'),
            '90': self.$t('Diskless(Detached)'),
            '-1': self.$t('DUnknown')
          }
          try {
            return d.metrics.map(it => ({
              node: it.labels.node,
              state: parseInt(it.value),
              stateStr: c[parseInt(it.value).toString()]
            }))
          } catch (e) {
            return []
          }
        },
        'linstor_storage_pool_error_count': (d) => {
          try {
            return d.metrics.map(it => {
              return {
                node: it.labels.node,
                driver: it.labels.driver,
                storage_pool: it.labels.storage_pool,
                state: parseInt(it.value)
              }
            }).filter(item => item.storage_pool !== 'DfltDisklessStorPool')
          } catch (e) {
            return []
          }
        },
        'linstor_error_reports_count': (d) => {
          try {
            return d.metrics
              .map(it => {
                return {
                  value: parseInt(it.value),
                  hostname: it.labels ? it.labels.hostname : ''
                }
              })
          } catch (e) {
            return 0
          }
        }
      }
      const showData = {}
      const result = await nodeApi.metrics()
      const resJSON = parsePrometheusTextFormat(result)
      console.log(resJSON, 'res')

      const linstor_volume_state = _.find(resJSON, { name: 'linstor_volume_state' })
      showData.linstor_volume_state = convert.linstor_volume_state(linstor_volume_state)

      const linstor_node_state = _.find(resJSON, { name: 'linstor_node_state' })
      console.log('linstor_node_state', linstor_node_state)
      showData.linstor_node_state = convert.linstor_node_state(linstor_node_state)

      const linstor_resource_state = _.find(resJSON, { name: 'linstor_resource_state' })
      console.log('linstor_resource_state', linstor_resource_state)
      showData.linstor_resource_state = convert.linstor_resource_state(linstor_resource_state)

      const linstor_storage_pool_error_count = _.find(resJSON, { name: 'linstor_storage_pool_error_count' })
      console.log('linstor_storage_pool_error_count', linstor_storage_pool_error_count)
      showData.linstor_storage_pool_error_count = convert.linstor_storage_pool_error_count(linstor_storage_pool_error_count)

      const linstor_error_reports_count = _.find(resJSON, { name: 'linstor_error_reports_count' })
      console.log(linstor_error_reports_count, 'linstor_error_reports_count')
      showData.linstor_error_reports_count = convert.linstor_error_reports_count(linstor_error_reports_count)

      this.panelData.error_num = showData.linstor_error_reports_count[0].value
      this.panelData.node_num = linstor_node_state.metrics.length
      this.panelData.resource_num = linstor_resource_state.metrics.length
      this.panelData.volume_num = linstor_volume_state.metrics.length

      // [{ value: 4, name: 'OFFLINE' }, { value: 6, name: 'CONNECTED' }],
      this.nodeData = Object.entries(
        showData.linstor_node_state.reduce((total, value) => {
          total[value.stateStr] = (total[value.stateStr] || 0) + 1
          return total
        }, {})
      ).map(it => {
        console.log('datalist', it)
        return { value: it[1], name: it[0] }
      })
      console.log(this.nodeData)

      // resourceData: [{ value: 2, name: 'unknown state' }, { value: 3, name: 'secondary' }, { value: 1, name: 'primary' }],
      this.resourceData = Object.entries(
        showData.linstor_resource_state.reduce((total, value) => {
          total[value.stateStr] = (total[value.stateStr] || 0) + 1
          return total
        }, {})
      ).map(it => {
        return { value: it[1], name: it[0] }
      })

      //      volumeData: [{ value: 22, name: 'UpToDate' }, { value: 25, name: 'Created' }],
      this.volumeData = Object.entries(
        showData.linstor_volume_state.reduce((total, value) => {
          total[value.stateStr] = (total[value.stateStr] || 0) + 1
          return total
        }, {})
      ).map(it => {
        return { value: it[1], name: it[0] }
      })

      // lineChartData: [120, 82, 91, 154, 162, 140, 145],

      let date = new Date().getTime()
      const lineData = []
      const resourcesDetail = Array.from(await rgApi.resourcesDetailList())

      while (lineData.length < 7) {
        date = date - (1000 * 60 * 60 * 24)
        lineData.push(resourcesDetail.filter(it => it.created_on <= date).length)
      }
      console.log('lineData', lineData.reverse())
      this.lineChartData = lineData

      const alist = []
      const blist = []
      const nodeList = Array.from(new Set(showData.linstor_storage_pool_error_count.map(it => it.node)))
      const drive = Array.from(new Set(showData.linstor_storage_pool_error_count.map(it => it.driver)))
      const storage_poolList = Array.from(new Set(showData.linstor_storage_pool_error_count.map(it => it.storage_pool)))

      for (const linstorStoragePoolErrorCountElement of showData.linstor_storage_pool_error_count) {
        for (const driveElement of drive) {
          alist.push({
            name: linstorStoragePoolErrorCountElement.storage_pool,
            type: 'bar',
            stack: driveElement,
            data: nodeList.map(it => {
              const r = showData.linstor_storage_pool_error_count.find(re => re.storage_pool === linstorStoragePoolErrorCountElement.storage_pool &&
                  re.driver === driveElement && re.node === it)
              return r ? r.state : 0
            })
          })
        }
      }

      for (const node of nodeList) {
        for (const driveElement of drive) {
          blist.push({
            name: node,
            type: 'bar',
            stack: driveElement,
            data: storage_poolList.map(it => {
              const r = showData.linstor_storage_pool_error_count.find(re => re.storage_pool === it &&
                    re.driver === driveElement && re.node === node)
              return r ? r.state : 0
            })
          })
        }
      }

      this.bar1.data = alist
      this.bar2.data = blist
      this.bar1.xValues = [...nodeList]
      this.bar2.xValues = [...storage_poolList]
      this.barChatData = this.bar1
      this.hanldeChange()
      this.initPieChart()
    },
    initPieChart() {
      const refs = ['node', 'resource', 'volume', 'line']
      for (const ref of refs) {
        this.$refs[ref].initChart()
      }
      this.$refs.bar.initChart(this.barChatData)
    },
    hanldeChange(val) {
      if (val === this.$t('node_num')) {
        this.barChatData = this.bar1
      } else if (val === this.$t('sp')) {
        this.barChatData = this.bar2
      }
      if (!this.$refs.bar.chart) {
        return
      }
      this.$refs.bar.chart = null
      this.$refs.bar.initChart(this.barChatData)
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .github-corner {
    position: absolute;
    top: 0px;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px;
    margin-bottom: 32px;
  }
}

.selector {
  margin: 20px auto;
  text-align: center;
}

@media (max-width: 1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
