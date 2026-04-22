// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import PageBasic from '@app/components/PageBasic';
import { Button } from '@app/components/Button';
import { List } from '@app/features/ha';

const HA = () => {
  const { t } = useTranslation(['ha', 'common']);
  const navigate = useNavigate();

  return (
    <PageBasic
      title={t('ha:list')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/reactor/create')}>
          {t('common:add')}
        </Button>
      }
    >
      <List />
    </PageBasic>
  );
};

export default HA;
