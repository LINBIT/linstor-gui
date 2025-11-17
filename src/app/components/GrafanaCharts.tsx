// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useMemo } from 'react';
import { Card, Row, Col, Empty } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@app/store';
import styled from '@emotion/styled';
import { usePreloadIframes } from '@app/hooks';

const ChartIframe = styled.iframe`
  width: 100%;
  height: 250px;
  border: none;
  background: #fff;
`;

const ChartCard = styled(Card)`
  margin-bottom: 16px;
  .ant-card-body {
    padding: 0;
  }
`;

interface GrafanaChartsProps {
  hostname: string;
}

interface ChartPanel {
  id?: number;
  title: string;
  key: 'cpu' | 'memory' | 'network' | 'disk' | 'diskIops' | 'ioUsage';
}

const GrafanaCharts: React.FC<GrafanaChartsProps> = ({ hostname }) => {
  const grafanaConfig = useSelector((state: RootState) => state.setting?.grafanaConfig);

  console.log('GrafanaCharts render:', { grafanaConfig, hostname });

  // Generate iframe URLs for preloading only if Grafana is enabled
  const iframeUrls = useMemo(() => {
    if (!grafanaConfig?.enable || !grafanaConfig?.baseUrl || !grafanaConfig?.dashboardUid) return [];

    const panels = [
      grafanaConfig.panelIds.cpu,
      grafanaConfig.panelIds.memory,
      grafanaConfig.panelIds.network,
      grafanaConfig.panelIds.disk,
      grafanaConfig.panelIds.diskIops,
      grafanaConfig.panelIds.ioUsage,
    ].filter(Boolean);

    return panels.map(
      (panelId) =>
        `${grafanaConfig.baseUrl}/d-solo/${grafanaConfig.dashboardUid}/_?panelId=${panelId}&from=now-1h&to=now&theme=light&refresh=10s&timezone=browser&var-job=node_exporter&var-diskdevices=%5Ba-z%5D%2B%7Cnvme%5B0-9%5D%2Bn%5B0-9%5D%2B%7Cmmcblk%5B0-9%5D%2B`,
    );
  }, [grafanaConfig?.enable, grafanaConfig?.baseUrl, grafanaConfig?.dashboardUid, grafanaConfig?.panelIds]);

  // Preload iframe URLs only if Grafana is enabled
  usePreloadIframes(iframeUrls, { prefetch: false });

  // Don't show if no grafanaConfig is available
  if (!grafanaConfig?.baseUrl || !grafanaConfig?.dashboardUid) {
    console.log('GrafanaCharts not showing: no grafanaConfig or dashboardUid');
    return null;
  }

  // Log sample embed URL for debugging
  const samplePanelId = grafanaConfig.panelIds.cpu || 77;
  const embedUrl = `${grafanaConfig.baseUrl}/d-solo/${grafanaConfig.dashboardUid}/_?var-node=${hostname}&panelId=${samplePanelId}&from=now-1h&to=now&theme=light&refresh=10s&timezone=browser&var-job=node_exporter&var-diskdevices=%5Ba-z%5D%2B%7Cnvme%5B0-9%5D%2Bn%5B0-9%5D%2B%7Cmmcblk%5B0-9%5D%2B`;
  console.log('Sample embed URL:', embedUrl);

  const panels: ChartPanel[] = [
    { id: grafanaConfig.panelIds.cpu, title: 'CPU Usage', key: 'cpu' },
    { id: grafanaConfig.panelIds.memory, title: 'Memory Usage', key: 'memory' },
    { id: grafanaConfig.panelIds.network, title: 'Network Traffic', key: 'network' },
    { id: grafanaConfig.panelIds.disk, title: 'Disk I/O', key: 'disk' },
    { id: grafanaConfig.panelIds.diskIops, title: 'Disk IOps', key: 'diskIops' },
    { id: grafanaConfig.panelIds.ioUsage, title: 'I/O Usage Read/Write', key: 'ioUsage' },
  ];

  // Filter out panels without IDs
  const validPanels = panels.filter((panel) => panel.id !== undefined);

  if (validPanels.length === 0) {
    return (
      <Card title="Performance Metrics" style={{ marginBottom: 16 }}>
        <Empty description="No Grafana panels configured. Please check your Grafana settings." />
      </Card>
    );
  }

  return (
    <Card title="Performance Metrics" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        {validPanels.map((panel) => (
          <Col xs={24} sm={24} md={12} key={panel.key}>
            <ChartCard title={panel.title} size="small">
              <ChartIframe
                title={panel.title}
                src={`${grafanaConfig.baseUrl}/d-solo/${grafanaConfig.dashboardUid}/_?panelId=${panel.id}&from=now-1h&to=now&theme=light&refresh=10s&timezone=browser&var-job=node_exporter&var-diskdevices=%5Ba-z%5D%2B%7Cnvme%5B0-9%5D%2Bn%5B0-9%5D%2B%7Cmmcblk%5B0-9%5D%2B`}
                loading="eager"
                onLoad={() => console.log(`Panel ${panel.title} loaded`)}
                onError={() => console.error(`Panel ${panel.title} failed to load`)}
              />
            </ChartCard>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default GrafanaCharts;
