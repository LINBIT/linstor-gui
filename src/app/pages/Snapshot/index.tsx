import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { List } from '@app/features/snapshot';

const SnapShot = () => {
  const { t } = useTranslation(['snapshot', 'common']);

  return (
    <PageBasic title={t('snapshot:list')}>
      <List />
    </PageBasic>
  );
};

export default SnapShot;
