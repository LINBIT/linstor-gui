import React from 'react';

import PageBasic from '@app/components/PageBasic';
import { BackUpList } from '@app/features/remote';

const BackupList = () => {
  return (
    <PageBasic title="Backups" showBack>
      <BackUpList />
    </PageBasic>
  );
};

export default BackupList;
