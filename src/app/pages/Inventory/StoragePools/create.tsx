import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { StoragePoolCreateForm } from '@app/features/storagePool';

const StoragePoolCreate = () => {
  return (
    <PageBasic title="Add Storage Pool">
      <StoragePoolCreateForm />
    </PageBasic>
  );
};

export default StoragePoolCreate;
