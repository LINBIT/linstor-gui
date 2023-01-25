import React, { useState, useCallback, useEffect } from 'react';
import { Button, Switch, TextInput } from '@patternfly/react-core';
import styled from 'styled-components';
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

// For setting Gateway related stuff
const Dashboard: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [host, setHost] = useState('');

  const dispatch = useDispatch<Dispatch>();

  const { dashboardEnabled, dashboardURL } = useSelector((state: RootState) => ({
    dashboardEnabled: state.setting.KVS.dashboardEnabled,
    dashboardURL: state.setting.KVS.dashboardURL,
  }));

  useEffect(() => {
    // read state from Linstor KVS
    setIsChecked(dashboardEnabled as boolean);
    setHost(dashboardURL as string);
  }, [dashboardEnabled, dashboardURL]);

  const handleChange = useCallback((isChecked) => {
    setIsChecked(isChecked);
  }, []);

  const handleSave = useCallback(() => {
    dispatch.setting.setDashboard({ dashboardEnabled: isChecked, host });
  }, [dispatch.setting, host, isChecked]);

  return (
    <>
      <Wrapper>
        <Label>Grafana Dashboard</Label>
        <Switch isChecked={isChecked} onChange={handleChange} aria-label="dashboard-mode" />

        {isChecked && (
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

export default Dashboard;
