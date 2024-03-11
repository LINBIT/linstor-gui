import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { NFSExportList } from '@app/features/vsan';

export const NFS = () => {
  return (
    <PageBasic title="NFS Export Configuration">
      <NFSExportList />
    </PageBasic>
  );
};
