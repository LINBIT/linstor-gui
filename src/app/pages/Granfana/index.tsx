// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { RootState } from '@app/store';
import styled from '@emotion/styled';
import React from 'react';
import { useSelector } from 'react-redux';

const IFramePage = styled.iframe`
  width: 100%;
  height: calc(100vh - 148px);
`;

export const GrafanaDashboard = () => {
  const { dashboardEnabled, dashboardURL } = useSelector((state: RootState) => ({
    dashboardEnabled: state.setting?.KVS?.dashboardEnabled,
    dashboardURL: state.setting?.KVS?.dashboardURL,
  }));
  if (!dashboardEnabled) {
    return null;
  }
  return <IFramePage title="dashboard" src={dashboardURL as string} />;
};
