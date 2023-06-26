import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { StoragePoolEditForm } from '@app/features/storagePool';

const StoragePoolEdit = () => {
  return (
    <PageBasic title="Edit Storage Pool">
      <StoragePoolEditForm />
    </PageBasic>
  );
};

export default StoragePoolEdit;
