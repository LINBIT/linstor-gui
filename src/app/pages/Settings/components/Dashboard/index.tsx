import React, { useState, useCallback, useEffect } from 'react';
import { Button, Switch } from '@patternfly/react-core';
import { Input, Tooltip } from 'antd';
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
  margin-right: 1em;
`;

// For setting Gateway related stuff
const Dashboard: React.FC = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [host, setHost] = useState('');

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
            <Tooltip title="This field is for the Grafana URL">
              <AddressLabelWrapper>Address:</AddressLabelWrapper>
            </Tooltip>
            <Input
              value={host}
              onChange={(e) => {
                setHost(e.target.value);
              }}
              aria-label="host"
            />
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
