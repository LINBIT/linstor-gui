import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateForm as CreateResourceDefinitionForm } from '@app/features/resourceDefinition';

const Create = () => {
  return (
    <PageBasic title="Create Resource Definition">
      <CreateResourceDefinitionForm />
    </PageBasic>
  );
};

export default Create;
