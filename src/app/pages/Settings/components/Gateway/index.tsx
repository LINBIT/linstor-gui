// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Switch } from 'antd';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

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
  margin-top: 1em;
  margin-right: 1em;
`;

const CustomHostWrapper = styled.div`
  margin-top: 1em;
  display: flex;
  align-items: center;
`;

const SaveButton = styled(Button)`
  margin-top: 1em;
`;

const StatusInfo = styled.div`
  margin-top: 1em;
`;

// For setting Gateway related stuff
const Gateway: React.FC = () => {
  const OriginHost = window.location.protocol + '//' + window.location.hostname + ':8080/';
  const [isChecked, setIsChecked] = useState(false);
  const [customHost, setCustomHost] = useState(false);
  const [host, setHost] = useState(OriginHost);

  const dispatch = useDispatch<Dispatch>();

  const { gatewayEnabled, gatewayHost, customHostFromSetting, gatewayAvailable } = useSelector((state: RootState) => ({
    gatewayEnabled: state?.setting?.KVS?.gatewayEnabled,
    gatewayHost: state?.setting?.KVS?.gatewayHost,
    customHostFromSetting: state?.setting?.KVS?.gatewayCustomHost,
    gatewayAvailable: state.setting.gatewayAvailable,
  }));

  useEffect(() => {
    // read state from Linstor KVS
    setIsChecked(gatewayEnabled as boolean);

    if (gatewayHost === '') {
      setHost(OriginHost);
    } else {
      setHost(gatewayHost as string);
    }

    setCustomHost(customHostFromSetting as boolean);
  }, [OriginHost, gatewayEnabled, gatewayHost, customHostFromSetting]);

  useEffect(() => {
    // check if Gateway is available
    dispatch.setting.getGatewayStatus();
  }, [dispatch.setting]);

  const handleChange = useCallback((isChecked: boolean) => {
    setIsChecked(isChecked);
  }, []);

  const handleSave = useCallback(() => {
    dispatch.setting.setGatewayMode({ gatewayEnabled: isChecked, host, customHost, showToast: gatewayAvailable });
  }, [gatewayAvailable, dispatch.setting, isChecked, host, customHost]);

  return (
    <>
      <Wrapper>
        <div>
          <h2>LINSTOR Gateway</h2>
          <p>
            Manages Highly-Available iSCSI targets and NFS exports via LINSTOR. Installing linstor-gateway is a
            prerequisite for enabling this feature.
          </p>
          <p>After enabling this feature, the Gateway entry will be displayed in the left-side menu.</p>
        </div>
        <Label>Gateway mode</Label>
        <Switch checked={isChecked} onChange={handleChange} aria-label="gateway-mode" />
        {isChecked && (
          <>
            <CustomHostWrapper>
              <Label>Custom host</Label>
              <Switch
                checked={customHost}
                onChange={(isChecked) => setCustomHost(isChecked)}
                aria-label="gateway-mode"
              />
            </CustomHostWrapper>
          </>
        )}
        {isChecked && customHost && (
          <AddressWrapper>
            <AddressLabelWrapper>Address:</AddressLabelWrapper>
            <Input
              value={host}
              defaultValue={OriginHost}
              onChange={(val) => setHost(val.target.value)}
              aria-label="host"
            />
          </AddressWrapper>
        )}
        {isChecked && (
          <StatusInfo>
            Status:{' '}
            {gatewayAvailable ? (
              <CheckCircleOutlined style={{ color: 'green' }} />
            ) : (
              <StopOutlined style={{ color: 'red' }} />
            )}
            {gatewayAvailable ? ' Available' : ' Not available'}
          </StatusInfo>
        )}
      </Wrapper>
      <SaveButton type="primary" onClick={handleSave}>
        Save
      </SaveButton>
    </>
  );
};

export default Gateway;
