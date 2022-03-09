import React, { useState, useCallback, useEffect } from 'react';
import { Button, Switch } from '@patternfly/react-core';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import { Dispatch, RootState } from '@app/store';

const Wrapper = styled.div`
  padding: 2em 0;
`;

const Label = styled.span`
  margin-right: 1em;
`;

// For setting Gateway related stuff
const Gateway: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);

  const dispatch = useDispatch<Dispatch>();

  const { gatewayEnabled } = useSelector((state: RootState) => ({
    gatewayEnabled: state.setting.KVS.gatewayEnabled,
  }));

  useEffect(() => {
    // read state from Linstor KVS
    setIsChecked(gatewayEnabled);
  }, [gatewayEnabled]);

  const handleChange = useCallback((isChecked) => {
    setIsChecked(isChecked);
  }, []);

  const handleSave = useCallback(() => {
    dispatch.setting.setGatewayMode(isChecked);
  }, [dispatch.setting, isChecked]);

  return (
    <>
      <Wrapper>
        <Label>Gateway mode</Label>
        <Switch isChecked={isChecked} onChange={handleChange} aria-label="gateway-mode" />
      </Wrapper>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  );
};

export default Gateway;
