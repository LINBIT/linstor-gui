import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { NVMeoFList } from '@app/features/vsan';

export const NVMeoF = () => {
  return (
    <PageBasic title="NVMe-oF Target Configuration">
      <NVMeoFList />
    </PageBasic>
  );
};
