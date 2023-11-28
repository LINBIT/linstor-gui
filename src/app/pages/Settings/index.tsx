import React, { useEffect, useState } from 'react';
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';

import PageBasic from '@app/components/PageBasic';
import { Dispatch, RootState } from '@app/store';
import Gateway from './components/Gateway';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import { VSAN } from './components/VSAN';

const GeneralSettings: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useDispatch<Dispatch>();
  // Toggle currently active tab
  const handleTabClick = (event, tabIndex) => {
    setActiveIndex(tabIndex);
  };

  const { vsanMode } = useSelector((state: RootState) => ({
    vsanMode: state?.setting?.KVS?.vsanMode,
  }));

  useEffect(() => {
    // Check Settings from Linstor Key-Value-Store
    dispatch.setting.getSettings();
    // check if Gateway is available
    dispatch.setting.getGatewayStatus();
  }, [dispatch.setting]);

  return (
    <PageBasic title="Settings">
      <Tabs activeKey={activeIndex} onSelect={handleTabClick} isBox>
        <Tab eventKey={0} title={<TabTitleText>General</TabTitleText>}>
          <Logo />
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Gateway</TabTitleText>}>
          <Gateway />
        </Tab>

        <Tab eventKey={2} title={<TabTitleText>Dashboard</TabTitleText>}>
          <Dashboard />
        </Tab>

        {vsanMode && (
          <Tab eventKey={3} title={<TabTitleText>VSAN</TabTitleText>}>
            <VSAN />
          </Tab>
        )}
      </Tabs>
    </PageBasic>
  );
};

export default GeneralSettings;
