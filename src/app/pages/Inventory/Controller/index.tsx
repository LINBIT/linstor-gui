import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { headerCol, ICell } from '@patternfly/react-table';

import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

import PageBasic from '@app/components/PageBasic';
import PropertyForm from '@app/components/PropertyForm';
import { omit } from '@app/utils/object';

const NodeList: React.FunctionComponent = () => {
  const { t } = useTranslation(['node', 'common']);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [initialProps] = useState<Record<string, unknown>>();

  const { run: handleUpdateNode } = useRequest(() => ({
    url: '/v1/controller/config',
  }));

  return (
    <PageBasic title={t('controller_list')}>
      <PropertyForm
        initialVal={initialProps}
        openStatus={propertyModalOpen}
        type="node"
        handleSubmit={handleUpdateNode}
        handleClose={() => setPropertyModalOpen(!propertyModalOpen)}
      />
    </PageBasic>
  );
};

export default NodeList;
