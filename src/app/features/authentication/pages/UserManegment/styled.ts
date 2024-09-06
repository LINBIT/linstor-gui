// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

export const MainContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow: auto;
`;

export const BG = styled.div`
  margin: -40px 0 -24px -24px;
  img {
    object-fit: cover;
    width: 100%;
    height: calc(100vh - 94px);
  }
`;

export const StyledSection = styled.div`
  display: flex;
  height: 100%;
`;
