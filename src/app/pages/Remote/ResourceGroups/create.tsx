import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateResourceGroupFrom } from '@app/features/resourceGroup';

const ResourceGroupCreate = () => {
  return (
    <PageBasic title="Create Resource Group">
      <CreateResourceGroupFrom />
    </PageBasic>
  );
};

export default ResourceGroupCreate;
