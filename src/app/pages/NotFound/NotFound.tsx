// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@app/components/Button';
import mazeSvg from '@app/assets/maze.svg';

const NotFound: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center text-center">
        <img src={mazeSvg} alt="404 maze" className="w-64 h-64 mb-6" />
        <h1 className="m-0 mb-6 text-6xl font-light">{t('common:not_found_title')}</h1>
        <p className="m-0 mb-6 text-lg text-(--text-secondary)">{t('common:not_found_text')}</p>
        <Button type="primary" onClick={handleGoHome}>
          {t('common:take_me_home')}
        </Button>
      </div>
    </div>
  );
};

export { NotFound };
