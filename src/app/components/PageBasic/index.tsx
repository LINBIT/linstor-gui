// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React, { PropsWithChildren } from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WidthProvider } from './WidthContext';

interface Props {
  title: string;
  loading?: boolean;
  error?: Error | undefined | boolean;
  alerts?: alertList;
  showBack?: boolean;
}

const PageBasic: React.FC<PropsWithChildren<Props>> = ({ showBack, title, children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);

  return (
    <main className="content">
      {/* className content is used by WidthProvider */}
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-lg font-semibold">{title}</h1>

        {showBack && <Button onClick={() => navigate(-1)}>&#8592;&nbsp;{t('common:back')}</Button>}
      </div>
      <WidthProvider>{children}</WidthProvider>
    </main>
  );
};

export default PageBasic;
