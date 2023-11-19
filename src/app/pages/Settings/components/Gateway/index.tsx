import React, { useState, useCallback, useEffect } from 'react';
import { Button, Switch, TextInput } from '@patternfly/react-core';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';

const Wrapper = styled.div`
  padding: 2em 0;
`;

const Label = styled.span`
  margin-right: 1em;
`;

const AddressWrapper = styled.div`
  margin-top: 1em;
  width: 20em;
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

// For setting Gateway related stuff
const Gateway: React.FC = () => {
  const OriginHost = window.location.protocol + '//' + window.location.hostname + ':8080/';
  const [isChecked, setIsChecked] = useState(false);
  const [customHost, setCustomHost] = useState(false);
  const [host, setHost] = useState(OriginHost);

  const dispatch = useDispatch<Dispatch>();

  const { gatewayEnabled, gatewayHost, customHostFromSetting } = useSelector((state: RootState) => ({
    gatewayEnabled: state?.setting?.KVS?.gatewayEnabled,
    gatewayHost: state?.setting?.KVS?.gatewayHost,
    customHostFromSetting: state?.setting?.KVS?.gatewayCustomHost,
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

  const handleChange = useCallback((isChecked) => {
    setIsChecked(isChecked);
  }, []);

  const handleSave = useCallback(() => {
    dispatch.setting.setGatewayMode({ gatewayEnabled: isChecked, host, customHost, showToast: true });
  }, [dispatch.setting, host, isChecked, customHost]);

  return (
    <>
      <Wrapper>
        <Label>Gateway mode</Label>
        <Switch isChecked={isChecked} onChange={handleChange} aria-label="gateway-mode" />
        {isChecked && (
          <>
            <CustomHostWrapper>
              <Label>Custom host</Label>
              <Switch
                isChecked={customHost}
                onChange={(isChecked) => setCustomHost(isChecked)}
                aria-label="gateway-mode"
              />
            </CustomHostWrapper>
          </>
        )}
        {isChecked && customHost && (
          <AddressWrapper>
            <AddressLabelWrapper>Address:</AddressLabelWrapper>
            <TextInput value={host} onChange={(val) => setHost(val)} aria-label="host" />
          </AddressWrapper>
        )}
      </Wrapper>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  );
};

export default Gateway;
