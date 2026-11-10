// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Skeleton } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { getErrorReportById } from '@app/features/report';

const ErrorReportDetail = () => {
  const { id } = useParams() as { id: string };
  const { data, isPending } = useQuery({
    queryKey: ['getErrorDetail', id],
    queryFn: () => {
      return getErrorReportById(id);
    },
    enabled: !!id,
  });

  const { t } = useTranslation('error_report');

  // The controller answers an unknown id with an empty list
  const report = data?.data?.[0];

  return (
    <PageBasic title={t('detail_title')} showBack>
      <Card>
        {isPending ? (
          // The report is a block of preformatted lines.
          <Skeleton active title={false} paragraph={{ rows: 12, width: ['60%', '45%', '70%', '35%', '80%', '55%'] }} />
        ) : report ? (
          <pre>{report.text}</pre>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('not_found', { id })} />
        )}
      </Card>
    </PageBasic>
  );
};

export default ErrorReportDetail;
