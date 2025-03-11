// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { getErrorReportById } from '@app/features/report';

const ErrorReportDetail = () => {
  const { id } = useParams() as { id: string };
  const { data, isLoading } = useQuery({
    queryKey: ['getErrorDetail', id],
    queryFn: () => {
      return getErrorReportById(id);
    },
    enabled: !!id,
  });

  const { t } = useTranslation('error_report');

  return (
    <PageBasic title={t('detail_title')} loading={isLoading} showBack>
      <Card>
        <pre>{data?.data?.[0].text}</pre>
      </Card>
    </PageBasic>
  );
};

export default ErrorReportDetail;
