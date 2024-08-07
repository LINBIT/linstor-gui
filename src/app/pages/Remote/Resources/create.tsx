import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { CreateResourceForm } from '@app/features/resource';

const ResourceCreate = () => {
  return (
    <PageBasic title="Create Resource">
      <CreateResourceForm />
    </PageBasic>
  );
};

export default ResourceCreate;
