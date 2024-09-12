import React from 'react';
import { CodeBlock, CodeBlockCode } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useRequest } from 'ahooks';
import { useParams } from 'react-router-dom';

import PageBasic from '@app/components/PageBasic';

const ErrorReportDetail: React.FC = () => {
  const { id } = useParams() as { id: string };
  const { data = [], loading } = useRequest(`/v1/error-reports/${id}`);
  const { t } = useTranslation('error_report');

  return (
    <PageBasic title={t('detail_title')} loading={loading} error={!loading && data.length === 0}>
      <CodeBlock>
        <CodeBlockCode>{data[0]?.text}</CodeBlockCode>
      </CodeBlock>
    </PageBasic>
  );
};

export default ErrorReportDetail;
