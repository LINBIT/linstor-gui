import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { CreateForm as EditIPForm } from '@app/features/ip';

const IpAddressEdit = () => {
  return (
    <PageBasic title="Edit IP Address">
      <EditIPForm editing />
    </PageBasic>
  );
};

export default IpAddressEdit;
