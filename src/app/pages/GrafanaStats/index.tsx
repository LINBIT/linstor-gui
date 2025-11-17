// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography, Select, Space } from 'antd';
import { useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { ArrowLeftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Button from '@app/components/Button';

import { RootState } from '@app/store';
import PageBasic from '@app/components/PageBasic';
import { usePreloadIframes } from '@app/hooks';

const { Title } = Typography;

const IframeContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  border-radius: 8px;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const ChartsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
`;

const ChartRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 400px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    height: 400px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 16px;
`;

const TimeRangeSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;

  .time-range-label {
    font-weight: 500;
    margin-right: 12px;
    color: #666;
  }

  .ant-select {
    min-width: 160px;
  }
`;

// Time range options similar to Grafana's default (expanded based on screenshot)
const TIME_RANGE_OPTIONS = [
  { label: 'Last 5 minutes', value: 'now-5m' },
  { label: 'Last 15 minutes', value: 'now-15m' },
  { label: 'Last 30 minutes', value: 'now-30m' },
  { label: 'Last 1 hour', value: 'now-1h' },
  { label: 'Last 3 hours', value: 'now-3h' },
  { label: 'Last 6 hours', value: 'now-6h' },
  { label: 'Last 12 hours', value: 'now-12h' },
  { label: 'Last 24 hours', value: 'now-24h' },
  { label: 'Last 2 days', value: 'now-2d' },
  { label: 'Last 7 days', value: 'now-7d' },
  { label: 'Last 30 days', value: 'now-30d' },
  { label: 'Last 90 days', value: 'now-90d' },
];

const GrafanaStats: React.FC = () => {
  const { t } = useTranslation(['common', 'settings']);
  const { nodeName, resourceName: routeResourceName } = useParams<{ nodeName: string; resourceName?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState('now-1h'); // Default to 1 hour

  // Get resource name from route params first, then fallback to query params
  const resourceName = routeResourceName || searchParams.get('resource') || '';

  const { grafanaConfig } = useSelector((state: RootState) => ({
    grafanaConfig: state.setting.grafanaConfig,
  }));

  const generateGrafanaUrl = useMemo(
    () => (panelId?: number) => {
      if (!nodeName || !grafanaConfig?.enable || !panelId) return '';

      const baseUrl = grafanaConfig.baseUrl || '';
      const dashboardUid = grafanaConfig.dashboardUid || '';

      if (!baseUrl || !dashboardUid) return '';

      // Use d-solo format for solo panel view (no top controls)
      return `${baseUrl}/d-solo/${dashboardUid}/_?panelId=${panelId}&from=${timeRange}&to=now&theme=light&refresh=30s&timezone=browser&var-job=node_exporter&var-nodename=${nodeName}`;
    },
    [nodeName, grafanaConfig?.enable, grafanaConfig?.baseUrl, grafanaConfig?.dashboardUid, timeRange],
  );

  const generateDrbdUrl = useMemo(
    () => (panelId?: number) => {
      if (!nodeName || !grafanaConfig?.enable || !grafanaConfig?.drbdEnable || !panelId) return '';

      const drbdUrl = grafanaConfig.drbdUrl || '';

      if (!drbdUrl) return '';

      // Extract base URL and UID from drbdUrl
      const parsedUrl = new URL(drbdUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

      // Extract UID and slug from pathname like /d/f_tZtVlMa/drbd
      const pathMatch = parsedUrl.pathname.match(/\/d\/([^/]+)\/([^/]+)/);
      const drbdUid = pathMatch ? pathMatch[1] : grafanaConfig.drbdUid || '';
      const slug = pathMatch ? pathMatch[2] : 'drbd';

      if (!drbdUid) return '';

      // Use d-solo format for solo panel view (no top controls)
      // Use $__all for instance to show all instances, but filter by specific resource
      let soloUrl = `${baseUrl}/d-solo/${drbdUid}/${slug}?orgId=1&panelId=panel-${panelId}&from=${timeRange}&to=now&timezone=browser&theme=light&refresh=30s&var-instance=$__all`;

      // Add specific resource filter if resourceName is provided, otherwise show all
      if (resourceName) {
        soloUrl += `&var-resource=${resourceName}`;
      } else {
        soloUrl += `&var-resource=$__all`;
      }

      return soloUrl;
    },
    [
      nodeName,
      grafanaConfig?.enable,
      grafanaConfig?.drbdEnable,
      grafanaConfig?.drbdUrl,
      grafanaConfig?.drbdUid,
      resourceName,
      timeRange,
    ],
  );

  // Generate URLs for the specific charts
  const cpuUrl = generateGrafanaUrl(grafanaConfig?.panelIds?.cpu || 77);
  const memoryUrl = generateGrafanaUrl(grafanaConfig?.panelIds?.memory || 78);
  const drbdWriteRateUrl = generateDrbdUrl(grafanaConfig?.drbdWriteRatePanelId || 28);
  const drbdReadRateUrl = generateDrbdUrl(grafanaConfig?.drbdReadRatePanelId || 29);

  // Preload all iframe URLs only if Grafana is enabled
  const iframeUrls = useMemo(() => {
    if (!grafanaConfig?.enable) return [];
    return [cpuUrl, memoryUrl, drbdWriteRateUrl, drbdReadRateUrl].filter(Boolean);
  }, [grafanaConfig?.enable, cpuUrl, memoryUrl, drbdWriteRateUrl, drbdReadRateUrl]);

  // Use the preload hook to preconnect and optionally prefetch
  usePreloadIframes(iframeUrls, { prefetch: false });

  useEffect(() => {
    if (!nodeName) {
      setError('Node name is required');
      setLoading(false);
      return;
    }

    if (!grafanaConfig?.enable) {
      setError(t('settings:grafana_dashboard_not_enabled'));
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [nodeName, resourceName, grafanaConfig, timeRange, t]);

  const handleGoBack = () => {
    navigate('/storage-configuration/resource-overview');
  };

  if (loading) {
    return (
      <PageBasic title={`${t('settings:node_stats_title')} - ${nodeName || 'Unknown'}`}>
        <LoadingContainer>
          <Spin size="large" />
          <Title level={4}>{t('settings:loading_drbd_dashboard')}</Title>
        </LoadingContainer>
      </PageBasic>
    );
  }

  if (error) {
    return (
      <PageBasic title={`${t('settings:node_stats_title')} - ${nodeName || 'Unknown'}`}>
        <Card>
          <Alert
            message={t('common:error')}
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={handleGoBack}>
                {t('settings:back_to_resources')}
              </Button>
            }
          />
        </Card>
      </PageBasic>
    );
  }

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  const renderIframe = (url: string, title: string) => {
    if (!url) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
          }}
        >
          {t('settings:drbd_dashboard_not_configured')}
        </div>
      );
    }

    return (
      <iframe
        src={url}
        title={title}
        loading="eager"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(t('settings:failed_to_load_dashboard'));
          setLoading(false);
        }}
        style={{
          display: 'block',
        }}
      />
    );
  };

  return (
    <PageBasic title="">
      <Card
        title={`${t('settings:dashboard_for_node', { nodeName })}${resourceName ? ` - ${resourceName}` : ''}`}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
            {t('settings:back_to_resources')}
          </Button>
        }
      >
        {/* Time Range Selector */}
        <TimeRangeSelector>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#666' }} />
          <span className="time-range-label">Time Range:</span>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            options={TIME_RANGE_OPTIONS}
            placeholder="Select time range"
            allowClear
            onClear={() => setTimeRange('now-1h')}
          />
        </TimeRangeSelector>

        <ChartsGrid>
          {/* First row: CPU and Memory panels - always show when Grafana is enabled */}
          <ChartRow>
            <IframeContainer>{renderIframe(cpuUrl, `CPU Basic for ${nodeName}`)}</IframeContainer>
            <IframeContainer>{renderIframe(memoryUrl, `Memory Basic for ${nodeName}`)}</IframeContainer>
          </ChartRow>

          {/* DRBD Reactor dashboard message when disabled */}
          {!grafanaConfig?.drbdEnable && (
            <Alert
              message="DRBD Reactor Dashboard"
              description={t('settings:drbd_reactor_dashboard_info')}
              type="info"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => navigate('/settings')}>
                  {t('settings:go_to_settings')}
                </Button>
              }
              style={{ marginTop: 16 }}
            />
          )}

          {/* Second row: DRBD Write Rate and DRBD Read Rate (only when DRBD is enabled) */}
          {grafanaConfig?.drbdEnable && (
            <ChartRow>
              <IframeContainer>
                {renderIframe(drbdWriteRateUrl, `DRBD Write Rate Dashboard for ${nodeName}`)}
              </IframeContainer>
              <IframeContainer>
                {renderIframe(drbdReadRateUrl, `DRBD Read Rate Dashboard for ${nodeName}`)}
              </IframeContainer>
            </ChartRow>
          )}
        </ChartsGrid>
      </Card>
    </PageBasic>
  );
};

export default GrafanaStats;
