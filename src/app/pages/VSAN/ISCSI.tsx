import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { ISCSIList } from '@app/features/vsan';

export const ISCSI = () => {
  return (
    <PageBasic title="iSCSI Target Configuration">
      <p>
        Here, the new storage managed by LINSTOR can be exposed as an iSCSI target. This allows you to use the
        replicated storage with an iSCSI initiator.
      </p>
      <ISCSIList />
    </PageBasic>
  );
};
