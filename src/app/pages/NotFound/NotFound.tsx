// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import Button from '@app/components/Button';
import mazeSvg from '@app/assets/maze.svg';

const Title = styled.h1`
  margin: 0 0 24px 0 !important;
`;

const Description = styled.p`
  margin: 0 0 24px 0 !important;
`;

const NotFound: React.FunctionComponent = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center text-center">
        <img src={mazeSvg} alt="404 maze" className="w-64 h-64 mb-6" />
        <Title className="text-6xl font-light">Sorry</Title>
        <Description className="text-lg text-gray-600">
          We didn't find a page that matches the address you navigated to.
        </Description>
        <Button type="primary" onClick={handleGoHome}>
          Take me home
        </Button>
      </div>
    </div>
  );
};

export { NotFound };
