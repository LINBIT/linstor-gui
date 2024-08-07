import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { List } from '@app/features/remote';

const RemoteList = () => {
  return (
    <PageBasic title="Remotes">
      <List />
    </PageBasic>
  );
};

export default RemoteList;
