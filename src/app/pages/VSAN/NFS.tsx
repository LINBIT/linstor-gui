import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { NFSExportList } from '@app/features/vsan';

export const NFS = () => {
  return (
    <PageBasic title="NFS Export Configuration">
      <p>This module allows exporting the highly available storage managed by LINSTOR via an NFS export.</p>
      <NFSExportList />
    </PageBasic>
  );
};
