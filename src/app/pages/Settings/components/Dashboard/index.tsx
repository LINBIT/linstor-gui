// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Form, Input, InputNumber, Card, Typography, message } from 'antd';
import { Switch } from '@app/components/Switch';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { CaretRightOutlined } from '@ant-design/icons';

import { Dispatch, RootState } from '@app/store';
import Button from '@app/components/Button';

const { Text, Title } = Typography;

const Wrapper = styled.div`
  padding: 0;
  max-width: 900px;
`;

const HeaderSection = styled.div`
  margin-bottom: 2em;

  h3 {
    margin-bottom: 0.5em;
  }
`;

const EnableSection = styled(Card)`
  margin-bottom: 2em;

  .ant-card-body {
    padding: 1.5em;
  }
`;

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;

  .ant-switch {
    min-width: 44px;
  }
`;

const ButtonGroup = styled.div`
  margin-top: 2em;
  display: flex;
  justify-content: flex-end;
  gap: 1em;

  button {
    min-width: 100px;
  }
`;

const FormSection = styled.div`
  .ant-form-item {
    margin-bottom: 1.5em;
  }

  .ant-form-item-label {
    font-weight: 500;
  }

  .ant-form-item-extra {
    margin-top: 0.5em;
    color: rgba(0, 0, 0, 0.45);
  }
`;

const ExpandableSection = styled.div`
  margin-top: 1em;

  .expandable-header {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.5em 0;
    user-select: none;

    &:hover {
      .expandable-icon {
        color: #1890ff;
      }
    }
  }

  .expandable-icon {
    margin-right: 0.5em;
    transition: transform 0.2s ease;
    color: rgba(0, 0, 0, 0.65);

    &.expanded {
      transform: rotate(90deg);
    }
  }

  .expandable-content {
    margin-top: 1em;
    padding: 1em;
    background: #fafafa;
    border-radius: 8px;
  }
`;

// Default panel IDs (hardcoded)
const DEFAULT_PANELS = {
  cpu: 77,
  memory: 78,
  network: 74,
  disk: 152,
  diskIops: 229,
  ioUsage: 9,
};

// Default DRBD panel IDs
const DEFAULT_DRBD_PANELS = {
  drbdWriteRatePanelId: 28,
  drbdReadRatePanelId: 29,
};

const Dashboard: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDrbdEnabled, setIsDrbdEnabled] = useState(false);
  const [panelConfigExpanded, setPanelConfigExpanded] = useState(false);
  const [drbdPanelConfigExpanded, setDrbdPanelConfigExpanded] = useState(false);
  const [form] = Form.useForm();
  const [drbdForm] = Form.useForm();

  const { t } = useTranslation(['common', 'settings']);
  const dispatch = useDispatch<Dispatch>();

  // Read grafana settings from Redux store's grafanaConfig
  const grafanaConfig = useSelector((state: RootState) => state?.setting?.grafanaConfig);

  const grafanaSettings = useMemo(() => {
    let settings: any = {
      enable: false,
      dashboardUrl: '',
      dashboardUid: '',
      ...DEFAULT_PANELS,
      drbdEnable: false,
      drbdUrl: '',
      drbdUid: '',
      ...DEFAULT_DRBD_PANELS,
    };

    // Use grafanaConfig from Redux state
    if (grafanaConfig) {
      settings = {
        enable: true,
        dashboardUrl: grafanaConfig.dashboardUrlTemplate || '',
        dashboardUid: grafanaConfig.dashboardUid || '',
        panelIdCpu: grafanaConfig.panelIds?.cpu,
        panelIdMemory: grafanaConfig.panelIds?.memory,
        panelIdNetwork: grafanaConfig.panelIds?.network,
        panelIdDisk: grafanaConfig.panelIds?.disk,
        panelIdDiskIops: grafanaConfig.panelIds?.diskIops,
        panelIdIoUsage: grafanaConfig.panelIds?.ioUsage,
        drbdEnable: grafanaConfig.drbdEnable || false,
        drbdUrl: grafanaConfig.drbdUrl || '',
        drbdUid: grafanaConfig.drbdUid || '',
        drbdWriteRatePanelId: grafanaConfig.drbdWriteRatePanelId || DEFAULT_DRBD_PANELS.drbdWriteRatePanelId,
        drbdReadRatePanelId: grafanaConfig.drbdReadRatePanelId || DEFAULT_DRBD_PANELS.drbdReadRatePanelId,
      };
      console.log('Loaded grafanaSettings from grafanaConfig:', settings);
    }

    return settings;
  }, [grafanaConfig]);

  // Extract UID from dashboard URL
  const extractDashboardUid = (url: string): string | null => {
    try {
      // Match format: http://192.168.123.117:3000/d/rYdddlPWk/node-exporter-full?...
      const match = url.match(/\/d\/([^/?]+)/);
      return match ? match[1] : null;
    } catch (e) {
      console.error('Failed to extract dashboard UID:', e);
      return null;
    }
  };

  // Extract UID from DRBD dashboard URL
  const extractDrbdDashboardUid = (url: string): string | null => {
    try {
      // Match format: http://192.168.123.117:3000/d/f_tZtVlMz/drbd?...
      console.log('Extracting DRBD UID from URL:', url);
      const match = url.match(/\/d\/([^/?]+)/);
      console.log('DRBD UID match result:', match);
      const uid = match ? match[1] : null;
      console.log('Extracted DRBD UID:', uid);
      return uid;
    } catch (e) {
      console.error('Failed to extract DRBD dashboard UID:', e);
      return null;
    }
  };

  // Initialize form values
  useEffect(() => {
    setIsEnabled(grafanaSettings.enable);
    setIsDrbdEnabled(grafanaSettings.drbdEnable);

    if (grafanaSettings.enable && grafanaSettings.dashboardUrl) {
      form.setFieldsValue({
        dashboardUrl: grafanaSettings.dashboardUrl,
        cpu: grafanaSettings.panelIdCpu || DEFAULT_PANELS.cpu,
        memory: grafanaSettings.panelIdMemory || DEFAULT_PANELS.memory,
        network: grafanaSettings.panelIdNetwork || DEFAULT_PANELS.network,
        disk: grafanaSettings.panelIdDisk || DEFAULT_PANELS.disk,
        diskIops: grafanaSettings.panelIdDiskIops || DEFAULT_PANELS.diskIops,
        ioUsage: grafanaSettings.panelIdIoUsage || DEFAULT_PANELS.ioUsage,
      });
    } else {
      // Set default values
      form.setFieldsValue({
        cpu: DEFAULT_PANELS.cpu,
        memory: DEFAULT_PANELS.memory,
        network: DEFAULT_PANELS.network,
        disk: DEFAULT_PANELS.disk,
        diskIops: DEFAULT_PANELS.diskIops,
        ioUsage: DEFAULT_PANELS.ioUsage,
      });
    }

    // Initialize DRBD form values
    if (grafanaSettings.drbdEnable && grafanaSettings.drbdUrl) {
      drbdForm.setFieldsValue({
        drbdUrl: grafanaSettings.drbdUrl,
        drbdWriteRatePanelId: grafanaSettings.drbdWriteRatePanelId || DEFAULT_DRBD_PANELS.drbdWriteRatePanelId,
        drbdReadRatePanelId: grafanaSettings.drbdReadRatePanelId || DEFAULT_DRBD_PANELS.drbdReadRatePanelId,
      });
    } else {
      // Set DRBD default values
      drbdForm.setFieldsValue({
        drbdWriteRatePanelId: DEFAULT_DRBD_PANELS.drbdWriteRatePanelId,
        drbdReadRatePanelId: DEFAULT_DRBD_PANELS.drbdReadRatePanelId,
      });
    }
  }, [grafanaSettings, drbdForm]);

  const handleEnableChange = useCallback((checked: boolean) => {
    setIsEnabled(checked);
    // If main Grafana dashboard is disabled, also disable DRBD dashboard
    if (!checked) {
      setIsDrbdEnabled(false);
    }
  }, []);

  const handleDrbdEnableChange = useCallback((checked: boolean) => {
    setIsDrbdEnabled(checked);
  }, []);

  const handleSave = useCallback(async () => {
    // Prepare basic config
    const baseConfig = {
      enable: isEnabled,
      dashboardUrl: '',
      dashboardUid: '',
      panelIds: DEFAULT_PANELS,
      drbdEnable: isDrbdEnabled,
      drbdUrl: '',
      drbdUid: '',
      drbdWriteRatePanelId: DEFAULT_DRBD_PANELS.drbdWriteRatePanelId,
      drbdReadRatePanelId: DEFAULT_DRBD_PANELS.drbdReadRatePanelId,
    };

    try {
      // Handle main dashboard settings
      if (isEnabled) {
        const values = await form.validateFields();

        // Extract UID from URL
        const dashboardUid = extractDashboardUid(values.dashboardUrl);

        if (!dashboardUid) {
          message.error(t('settings:invalid_dashboard_url'));
          return;
        }

        baseConfig.enable = true;
        baseConfig.dashboardUrl = values.dashboardUrl;
        baseConfig.dashboardUid = dashboardUid;
        baseConfig.panelIds = {
          cpu: values.cpu || DEFAULT_PANELS.cpu,
          memory: values.memory || DEFAULT_PANELS.memory,
          network: values.network || DEFAULT_PANELS.network,
          disk: values.disk || DEFAULT_PANELS.disk,
          diskIops: values.diskIops || DEFAULT_PANELS.diskIops,
          ioUsage: values.ioUsage || DEFAULT_PANELS.ioUsage,
        };

        // Handle DRBD dashboard settings only if main dashboard is enabled
        if (isDrbdEnabled) {
          const drbdValues = await drbdForm.validateFields();

          // Extract UID from DRBD URL
          const drbdUid = extractDrbdDashboardUid(drbdValues.drbdUrl);

          if (!drbdUid) {
            message.error(t('settings:invalid_drbd_dashboard_url'));
            return;
          }

          baseConfig.drbdEnable = true;
          baseConfig.drbdUrl = drbdValues.drbdUrl;
          baseConfig.drbdUid = drbdUid;
          baseConfig.drbdWriteRatePanelId = drbdValues.drbdWriteRatePanelId || DEFAULT_DRBD_PANELS.drbdWriteRatePanelId;
          baseConfig.drbdReadRatePanelId = drbdValues.drbdReadRatePanelId || DEFAULT_DRBD_PANELS.drbdReadRatePanelId;
        } else {
          // Explicitly disable DRBD if main dashboard is disabled
          baseConfig.drbdEnable = false;
        }
      } else {
        // If main dashboard is disabled, ensure DRBD is also disabled
        baseConfig.drbdEnable = false;
      }

      // Save configuration to dedicated namespace
      await dispatch.setting.saveGrafanaConfig(baseConfig);
    } catch (error) {
      console.error('Failed to save:', error);
      // Error notification is already handled by the Redux action
    }
  }, [isEnabled, isDrbdEnabled, form, drbdForm, dispatch.setting, t]);

  return (
    <Wrapper>
      <HeaderSection>
        <Title level={3}>{t('settings:grafana')}</Title>
        <Text type="secondary">{t('settings:grafana_description')}</Text>
        <div style={{ marginTop: '1em' }}>
          <Text type="secondary">{t('settings:grafana_prerequisites_note')}</Text>
          <pre style={{ marginTop: '0.5em', padding: '0.5em', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            {t('settings:grafana_prerequisites_config')}
          </pre>
        </div>
      </HeaderSection>

      <EnableSection>
        <SwitchWrapper>
          <Text strong>{t('settings:grafana_dashboard')}</Text>
          <Switch
            checked={isEnabled}
            onChange={handleEnableChange}
            aria-label="dashboard-mode"
            checkedChildren={t('common:on')}
            unCheckedChildren={t('common:off')}
          />
        </SwitchWrapper>
      </EnableSection>

      {isEnabled && (
        <Card>
          <FormSection>
            <Form form={form} layout="vertical">
              <Form.Item
                label={t('settings:dashboard_url')}
                name="dashboardUrl"
                rules={[{ required: true, message: t('settings:please_enter_dashboard_url') }]}
                help={t('settings:dashboard_url_help')}
              >
                <Input
                  placeholder="http://192.168.123.117:3000/d/rYdddlPWk/node-exporter-full?orgId=1&refresh=1m"
                  size="large"
                />
              </Form.Item>

              <ExpandableSection>
                <div className="expandable-header" onClick={() => setPanelConfigExpanded(!panelConfigExpanded)}>
                  <CaretRightOutlined className={`expandable-icon ${panelConfigExpanded ? 'expanded' : ''}`} />
                  <Text strong>{t('settings:panel_configuration')}</Text>
                </div>

                {panelConfigExpanded && (
                  <div className="expandable-content">
                    <Text type="secondary">{t('settings:panel_ids_default_values')}</Text>

                    <Form.Item label={t('settings:cpu_panel_id')} name="cpu" help={t('settings:cpu_panel_help')}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label={t('settings:memory_panel_id')}
                      name="memory"
                      help={t('settings:memory_panel_help')}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label={t('settings:network_panel_id')}
                      name="network"
                      help={t('settings:network_panel_help')}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item label={t('settings:disk_panel_id')} name="disk" help={t('settings:disk_panel_help')}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label={t('settings:disk_iops_panel_id')}
                      name="diskIops"
                      help={t('settings:disk_iops_panel_help')}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label={t('settings:io_usage_panel_id')}
                      name="ioUsage"
                      help={t('settings:io_usage_panel_help')}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                )}
              </ExpandableSection>
            </Form>
          </FormSection>

          {/* DRBD Dashboard Section - moved inside main card */}
          <div style={{ marginTop: '2em', paddingTop: '2em', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ marginBottom: '1em' }}>
              <SwitchWrapper>
                <Text strong style={{ color: isEnabled ? 'inherit' : '#d9d9d9' }}>
                  {t('settings:drbd_dashboard')}
                </Text>
                <Switch
                  checked={isDrbdEnabled}
                  onChange={handleDrbdEnableChange}
                  aria-label="drbd-dashboard-mode"
                  checkedChildren={t('common:on')}
                  unCheckedChildren={t('common:off')}
                  disabled={!isEnabled}
                />
              </SwitchWrapper>
              {!isEnabled && (
                <Text type="secondary" style={{ marginLeft: '1em', fontSize: '12px' }}>
                  ({t('settings:drbd_requires_grafana_enabled')})
                </Text>
              )}
            </div>

            {isDrbdEnabled && (
              <FormSection>
                <Form form={drbdForm} layout="vertical">
                  <Form.Item
                    label={t('settings:drbd_dashboard_url')}
                    name="drbdUrl"
                    rules={[{ required: true, message: t('settings:please_enter_drbd_dashboard_url') }]}
                    help={t('settings:drbd_url_help')}
                  >
                    <Input
                      placeholder="http://192.168.123.117:3000/d/f_tZtVlMz/drbd?orgId=1&refresh=30s"
                      size="large"
                    />
                  </Form.Item>

                  <ExpandableSection>
                    <div
                      className="expandable-header"
                      onClick={() => setDrbdPanelConfigExpanded(!drbdPanelConfigExpanded)}
                    >
                      <CaretRightOutlined className={`expandable-icon ${drbdPanelConfigExpanded ? 'expanded' : ''}`} />
                      <Text strong>{t('settings:drbd_panel_configuration')}</Text>
                    </div>

                    {drbdPanelConfigExpanded && (
                      <div className="expandable-content">
                        <Text type="secondary">{t('settings:drbd_panel_config_description')}</Text>

                        <Form.Item
                          label={t('settings:drbd_write_rate_panel_id')}
                          name="drbdWriteRatePanelId"
                          help={t('settings:drbd_write_rate_panel_help')}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                          label={t('settings:drbd_read_rate_panel_id')}
                          name="drbdReadRatePanelId"
                          help={t('settings:drbd_read_rate_panel_help')}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                    )}
                  </ExpandableSection>
                </Form>
              </FormSection>
            )}
          </div>
        </Card>
      )}

      {/* Single Save Button */}
      <ButtonGroup>
        <Button type="primary" onClick={handleSave}>
          {t('common:save')}
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
};

export default Dashboard;
