import React, { useCallback, useEffect, useState } from 'react';
import parsePrometheusTextFormat from 'parse-prometheus-text-format';
import { useTranslation } from 'react-i18next';
import { useRequest } from 'ahooks';
import dayjs from 'dayjs';

import { InfrastructureIcon, ResourcePoolIcon, ContainerNodeIcon, BellIcon } from '@patternfly/react-icons';

import { getString } from '@app/utils/stringUtils';
import { fetchMetrics, resourcesDetailList } from '@app/requests/dashboard';

import PageBasic from '@app/components/PageBasic';
import PieChart from './components/PieChart';
import SummeryCard from './components/SummeryCard';

import './Dashboard.css';

type TDashItem = {
  help: string;
  name: string;
  type: string;
  metrics: Array<{ value: string; labels: unknown }>;
};

const NODE = 'linstor_node_state';
const RESOURCE = 'linstor_resource_state';
const VOLUME = 'linstor_volume_state';
const ERROR_REPORT = 'linstor_error_reports_count';

type metricData = {
  metrics: TDashItem[];
  pieChartData: {
    y: number;
    x: string;
  }[];
  stateMap: {
    [key: number]: string;
  };
};

const Dashboard: React.FunctionComponent = () => {
  const [nodeInfo, setNodeInfo] = useState<metricData>();
  const [resourceInfo, setResourceInfo] = useState<metricData>();
  const [volumeInfo, setVolumeInfo] = useState<metricData>();
  const { t } = useTranslation(['dashboard', 'common']);

  const [summeryData, setSummeryData] = useState<{
    node: number;
    resource: number;
    volume: number;
    errorReport: number;
  }>();

  const {
    data: metrics,
    error,
    loading,
  } = useRequest(fetchMetrics, {
    throwOnError: true,
    defaultLoading: true,
  });

  // For disk creation records
  useRequest(resourcesDetailList, {
    throwOnError: true,
    onSuccess: (resourcesDetail) => {
      console.log(resourcesDetail, 'resourcesDetailList');
      let date = new Date().getTime();
      const lineData: { x: string; y: number }[] = [];

      for (let index = 0; index < 7; index++) {
        date = date - 1000 * 60 * 60 * 24;

        lineData.push({
          x: dayjs(date).format('MM-DD'),
          y: resourcesDetail.filter((it) => it?.created_on <= date).length,
        });
      }
    },
  });

  /**
   * Generate help text map
   */
  const handleStateMap = useCallback((help: string) => {
    const res = {};
    if (help) {
      const helpTextArr = help.split(',').filter((e) => e);
      // [ "0=\"OFFLINE\"", " 1=\"CONNECTED\"", " 2=\"ONLINE\"", " 3=\"VERSION_MISMATCH\"", " 4=\"FULL_SYNC_FAILED\"", " 5=\"AUTHENTICATION_ERROR\"", " 6=\"UNKNOWN\"", " 7=\"HOSTNAME_MISMATCH\"", " 8=\"OTHER_CONTROLLER\"", " 9=\"AUTHENTICATED\"", " 10=\"NO_STLT_CONN\"" ]
      for (const helpText of helpTextArr) {
        const keyValue = helpText.split('=').map((e) => getString(e).toLowerCase());
        res[keyValue[0]] = keyValue[1];
      }
    }

    return res;
  }, []);

  /**
   * Generate pie chart data(state data)
   */
  const handleStateData = useCallback(
    (field: string, data) => {
      const stateData = data.find((e) => e.name === field);

      const stateMap = handleStateMap(stateData.help);

      const metrics =
        stateData?.metrics.map((it) => {
          return {
            node: it?.labels?.node,
            state: parseInt(it.value),
            stateStr: stateMap[parseInt(it.value).toString()],
          };
        }) || [];

      const pieChartData = Object.entries(
        metrics.reduce((total, value) => {
          total[value.stateStr] = (total[value.stateStr] || 0) + 1;
          return total;
        }, {})
      ).map((it) => {
        return { y: it[1] as number, x: it[0] as string };
      });

      return {
        metrics,
        pieChartData,
        stateMap,
      };
    },
    [handleStateMap]
  );

  /**
   *  Generate summery data about node/resource/volume/error reports number
   */

  useEffect(() => {
    if (metrics) {
      let data;

      try {
        data = parsePrometheusTextFormat(metrics);

        console.log(data, 'parsed data');

        const nodeData = handleStateData(NODE, data);
        const resourceData = handleStateData(RESOURCE, data);
        const volumeData = handleStateData(VOLUME, data);
        const errorReportData = data.find((e) => e.name === ERROR_REPORT);

        console.log(nodeData, 'nodeData');
        console.log(resourceData, 'resourceData');
        console.log(volumeData, 'volumeData');

        // Summery data
        const summery = {
          node: nodeData.metrics.length,
          resource: resourceData.metrics.length,
          volume: volumeData.metrics.length,
          errorReport: errorReportData ? parseInt(errorReportData.metrics[0].value) : 0,
        };

        setSummeryData(summery);
        setNodeInfo(nodeData);
        setVolumeInfo(volumeData);
        setResourceInfo(resourceData);
      } catch (error) {
        console.log(error, error);
      }
    }
  }, [handleStateData, metrics]);

  return (
    <PageBasic title={t('dashboard:title')} error={error} loading={loading}>
      <div className="summery">
        <SummeryCard
          title={t('common:nodes')}
          value={summeryData?.node ?? 0}
          icon={<InfrastructureIcon />}
          url="/inventory/nodes"
        />
        <SummeryCard
          title={t('common:resources')}
          value={summeryData?.resource ?? 0}
          icon={<ResourcePoolIcon />}
          url="/storage-configuration/resources"
        />
        <SummeryCard
          title={t('common:volumes')}
          value={summeryData?.volume ?? 0}
          icon={<ContainerNodeIcon />}
          url="/storage-configuration/volumes"
        />
        <SummeryCard
          title={t('common:error_reports')}
          value={summeryData?.errorReport ?? 0}
          icon={<BellIcon />}
          url="/error-reports"
        />
      </div>

      <div className="pie">
        <PieChart
          title={t('common:nodes')}
          data={nodeInfo?.pieChartData}
          legendData={nodeInfo?.pieChartData?.map((e) => ({ name: `${e.x}: ${e.y}` }))}
        />

        <PieChart
          title={t('common:resources')}
          data={resourceInfo?.pieChartData}
          legendData={resourceInfo?.pieChartData?.map((e) => ({ name: `${e.x}: ${e.y}` }))}
        />

        <PieChart
          title={t('common:volumes')}
          data={volumeInfo?.pieChartData}
          legendData={volumeInfo?.pieChartData?.map((e) => ({ name: `${e.x}: ${e.y}` }))}
        />
      </div>
      {/*
      <div className="line-chart">
        <SimpleLineChart data={resourceRecords} />
      </div> */}
    </PageBasic>
  );
};

export default Dashboard;
