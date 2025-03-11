// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { Button, Result } from 'antd';
import { useHistory } from 'react-router-dom';

const NotFound: React.FunctionComponent = () => {
  const history = useHistory();

  const handleGoHome = () => {
    history.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <Result
        status="404"
        title="404 Page not found"
        subTitle="We didn't find a page that matches the address you navigated to."
        extra={
          <Button type="primary" onClick={handleGoHome}>
            Take me home
          </Button>
        }
      />
    </div>
  );
};

export { NotFound };
