import React from 'react';
import PageBasic from '@app/components/PageBasic';
import { CreateNodeForm } from '@app/features/node';

const NodeEdit: React.FC = () => {
  return (
    <PageBasic title="Edit Node">
      <CreateNodeForm editing />
    </PageBasic>
  );
};

export default NodeEdit;
