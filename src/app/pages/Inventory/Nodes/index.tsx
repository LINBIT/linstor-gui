import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { List as ListV2 } from '@app/features/node/components/List';

const NodeList: React.FunctionComponent = () => {
  const { t } = useTranslation(['node', 'common']);

  return (
    <PageBasic title={t('node_list')}>
      <ListV2 />
    </PageBasic>
  );
};

export default NodeList;
