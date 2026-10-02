// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@app/components/Button';
import mazeSvg from '@app/assets/maze.svg';

const NotFound: React.FunctionComponent = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center text-center">
        <img src={mazeSvg} alt="404 maze" className="w-64 h-64 mb-6" />
        <h1 className="m-0 mb-6 text-6xl font-light">Sorry</h1>
        <p className="m-0 mb-6 text-lg text-(--text-secondary)">
          We didn't find a page that matches the address you navigated to.
        </p>
        <Button type="primary" onClick={handleGoHome}>
          Take me home
        </Button>
      </div>
    </div>
  );
};

export { NotFound };
