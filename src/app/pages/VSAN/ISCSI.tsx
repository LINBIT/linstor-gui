import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { ISCSIList } from '@app/features/vsan';

export const ISCSI = () => {
  return (
    <PageBasic title="iSCSI Target Configuration">
      <ISCSIList />
    </PageBasic>
  );
};
