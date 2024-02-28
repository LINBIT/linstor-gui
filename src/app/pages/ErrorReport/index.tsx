import React from 'react';
import { useTranslation } from 'react-i18next';

import PageBasic from '@app/components/PageBasic';
import { List } from '@app/features/report';

const ErrorReportList: React.FunctionComponent = () => {
  const { t } = useTranslation(['error_report', 'common']);

  return (
    <PageBasic title={t('list_title')}>
      <List />
    </PageBasic>
  );
};

export default ErrorReportList;
