// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

export const MainContent = styled.div`
  flex: 4;
  padding: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  border: 1px solid #eee;
  border-left: none;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
`;

export const BG = styled.img`
  object-fit: cover;
  flex: 1;
  height: calc(100vh - 200px);
  opacity: 0.2;
`;

export const StyledSection = styled.div`
  display: flex;
  border-radius: 16px;
  background-color: #fff;
  height: calc(100vh - 200px);
`;
