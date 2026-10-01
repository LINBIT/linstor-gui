// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Alert, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Button from '@app/components/Button';
import TimeRangeSelector from '@app/components/TimeRangeSelector';

import PageBasic from '@app/components/PageBasic';
import { usePreloadIframes, useThemeMode } from '@app/hooks';
import { useSettings } from '@app/features/settings/useSettings';
import { cssVar } from '@app/const/themeTokens';

const { Title } = Typography;

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

  const { grafanaConfig } = useSettings();

  const { mode } = useThemeMode();

  const generateGrafanaUrl = useMemo(
    () => (panelId?: number) => {
      if (!nodeName || !grafanaConfig?.enable || !panelId) return '';

      const baseUrl = grafanaConfig.baseUrl || '';
      const dashboardUid = grafanaConfig.dashboardUid || '';

      if (!baseUrl || !dashboardUid) return '';

      // Build URL parameters using URLSearchParams for better maintainability
      const params = new URLSearchParams({
        panelId: String(panelId),
        viewPanel: `panel-${panelId}`,
        from: timeRange,
        to: 'now',
        theme: mode,
        refresh: '10s',
        timezone: 'browser',
        'var-nodename': nodeName,
      });

      return `${baseUrl}/d-solo/${dashboardUid}/_?${params.toString()}`;
    },
    [nodeName, grafanaConfig?.enable, grafanaConfig?.baseUrl, grafanaConfig?.dashboardUid, timeRange, mode],
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

      // Build URL parameters using URLSearchParams for better maintainability
      const params = new URLSearchParams({
        panelId: String(panelId),
        viewPanel: `panel-${panelId}`,
        from: timeRange,
        to: 'now',
        timezone: 'browser',
        theme: mode,
        refresh: '10s',
        'var-instance': '$__all',
        'var-resource': resourceName || '$__all',
      });

      return `${baseUrl}/d-solo/${drbdUid}/${slug}?${params.toString()}`;
    },
    [
      nodeName,
      grafanaConfig?.enable,
      grafanaConfig?.drbdEnable,
      grafanaConfig?.drbdUrl,
      grafanaConfig?.drbdUid,
      resourceName,
      timeRange,
      mode,
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
        <div className="flex h-[400px] flex-col items-center justify-center gap-4">
          <Spin size="large" />
          <Title level={4}>{t('settings:loading_drbd_dashboard')}</Title>
        </div>
      </PageBasic>
    );
  }

  if (error) {
    return (
      <PageBasic title={`${t('settings:node_stats_title')} - ${nodeName || 'Unknown'}`}>
        <Card>
          <Alert
            title={t('common:error')}
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
            color: cssVar('text/muted'),
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
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />

        <div className="mb-4 flex flex-col gap-4">
          {/* First row: CPU and Memory panels - always show when Grafana is enabled */}
          <div className="grid h-[400px] grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
            <div className="h-full min-h-[400px] w-full overflow-hidden rounded-lg border-none [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-none">
              {renderIframe(cpuUrl, `CPU Basic for ${nodeName}`)}
            </div>
            <div className="h-full min-h-[400px] w-full overflow-hidden rounded-lg border-none [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-none">
              {renderIframe(memoryUrl, `Memory Basic for ${nodeName}`)}
            </div>
          </div>

          {/* DRBD Reactor dashboard message when disabled */}
          {!grafanaConfig?.drbdEnable && (
            <Alert
              title={t('settings:drbd_reactor_dashboard')}
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
            <div className="grid h-[400px] grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
              <div className="h-full min-h-[400px] w-full overflow-hidden rounded-lg border-none [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-none">
                {renderIframe(drbdWriteRateUrl, `DRBD Write Rate Dashboard for ${nodeName}`)}
              </div>
              <div className="h-full min-h-[400px] w-full overflow-hidden rounded-lg border-none [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-none">
                {renderIframe(drbdReadRateUrl, `DRBD Read Rate Dashboard for ${nodeName}`)}
              </div>
            </div>
          )}
        </div>
      </Card>
    </PageBasic>
  );
};

export default GrafanaStats;
