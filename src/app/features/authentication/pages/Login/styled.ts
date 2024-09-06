// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

export const LoginContainer = styled.main`
  display: flex;
  flex-direction: row;
  background: #eeeeee;
  height: 100vh;
  overflow: hidden;
`;

export const LoginLeft = styled.aside`
  height: 100vh;
`;

export const LoginImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const LoginRight = styled.section`
  display: flex;
  flex-direction: column;
  padding: 2rem 4rem;
  width: 100%;
`;

export const Logo = styled.img`
  width: 10rem;
  height: 4rem;
`;

export const LoginTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  margin: 2rem 0;
`;
