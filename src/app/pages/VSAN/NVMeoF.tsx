import React from 'react';
import { Card, Col, Row } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { NVMeoFList } from '@app/features/vsan';

export const NVMeoF = () => {
  return (
    <PageBasic title="NVMe-oF Target Configuration">
      <p>This module allows exporting the highly available storage managed by LINSTOR via NVMe-oF.</p>
      <NVMeoFList />
    </PageBasic>
  );
};
