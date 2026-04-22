// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';

import PageBasic from '@app/components/PageBasic';
import { List } from '@app/features/files/components';

const FilesList: React.FunctionComponent = () => {
  const { t } = useTranslation(['files', 'common']);

  return (
    <PageBasic title={t('title')}>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 16 }}>
        {t('description')}
      </Typography.Paragraph>
      <List />
    </PageBasic>
  );
};

export default FilesList;
