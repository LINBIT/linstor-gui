// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useCallback, useEffect } from 'react';
import { Input, Tooltip, Button, Switch, message } from 'antd';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Dispatch, RootState } from '@app/store';

const Wrapper = styled.div`
  padding: 0;
`;

const Label = styled.span`
  margin-right: 1em;
`;

const AddressWrapper = styled.div`
  margin-top: 1em;
  width: 30em;
  display: flex;
  align-items: center;
`;

const AddressLabelWrapper = styled.div`
  margin-right: 1em;
`;

const SaveButton = styled(Button)`
  margin-top: 1em;
`;

// For setting Gateway related stuff
const Dashboard: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [host, setHost] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const { t } = useTranslation(['common', 'settings']);

  const dispatch = useDispatch<Dispatch>();

  const { dashboardEnabled, dashboardURL } = useSelector((state: RootState) => ({
    dashboardEnabled: state?.setting?.KVS?.dashboardEnabled,
    dashboardURL: state?.setting?.KVS?.dashboardURL,
  }));

  useEffect(() => {
    // read state from LINSTOR KVS
    setIsChecked(dashboardEnabled as boolean);
    setHost(dashboardURL as string);
  }, [dashboardEnabled, dashboardURL]);

  const handleChange = useCallback((isChecked: boolean) => {
    setIsChecked(isChecked);
  }, []);

  const handleSave = useCallback(() => {
    if (!isChecked) {
      dispatch.setting.setDashboard({ dashboardEnabled: isChecked, host: '' });
    } else {
      if (!host) {
        messageApi.open({
          type: 'error',
          content: 'Please enter the Grafana URL.',
        });
        return;
      }
      dispatch.setting.setDashboard({ dashboardEnabled: isChecked, host });
    }
  }, [dispatch.setting, host, isChecked, messageApi]);

  return (
    <>
      {contextHolder}
      <Wrapper>
        <div>
          <p>{t('settings:grafana_description')}</p>
        </div>
        <Label>{t('settings:grafana_dashboard')}</Label>
        <Switch checked={isChecked} onChange={handleChange} aria-label="dashboard-mode" />

        {isChecked && (
          <AddressWrapper>
            <Tooltip title="This field is for the Grafana URL">
              <AddressLabelWrapper>{t('settings:grafana_url')}:</AddressLabelWrapper>
            </Tooltip>
            <Input.TextArea
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
              }}
              aria-label="host"
              placeholder="http://192.168.123.117:3000/d/f_tZtVlMz/linstor-drbd?from=2024-11-12T05:17:18.650Z&to=2024-11-12T05:47:18.650Z&var-ds_prometheus=ce1tl8xtaztvkc&var-node=$__all&theme=light"
              rows={6}
            />
          </AddressWrapper>
        )}
      </Wrapper>
      <SaveButton type="primary" onClick={handleSave}>
        {t('common:save')}
      </SaveButton>
    </>
  );
};

export default Dashboard;
