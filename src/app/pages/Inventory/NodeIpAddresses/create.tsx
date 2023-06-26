import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { CreateForm as CreateIPForm } from '@app/features/ip';

const NodeIpAddressCreate = () => {
  return (
    <PageBasic title="Add IP Address">
      <CreateIPForm />
    </PageBasic>
  );
};

export default NodeIpAddressCreate;
