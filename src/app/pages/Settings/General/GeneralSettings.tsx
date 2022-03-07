import React, { useEffect, useState } from 'react';
import { Tabs, Tab, TabTitleText, Button } from '@patternfly/react-core';
import { useDispatch } from 'react-redux';

import PageBasic from '@app/components/PageBasic';
import { Dispatch } from '@app/store';
import Gateway from '../components/Gateway';

const GeneralSettings: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const dispatch = useDispatch<Dispatch>();
  // Toggle currently active tab
  const handleTabClick = (event, tabIndex) => {
    setActiveIndex(tabIndex);
  };

  useEffect(() => {
    // Check Gateway Status
    // dispatch.setting.getGatewayStatus();
  }, [dispatch.setting]);

  return (
    <PageBasic title="Settings">
      <Tabs activeKey={activeIndex} onSelect={handleTabClick} isBox>
        <Tab eventKey={0} title={<TabTitleText>Gateway</TabTitleText>}>
          <Gateway />
        </Tab>
      </Tabs>
      <div className="">
        <Button variant="primary">Save</Button>
      </div>
    </PageBasic>
  );
};

export default GeneralSettings;
