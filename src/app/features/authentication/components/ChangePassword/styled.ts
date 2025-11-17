// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

export const Content = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 400px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    min-height: auto;
    height: auto;
  }
`;

export const BGImg = styled.img`
  max-width: 422px;
  max-height: 620px;
  object-fit: cover;
  width: 100%;
  height: auto;
  flex-shrink: 0;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;

  @media (max-width: 768px) {
    flex: 1;
    padding: 1.5rem;
    width: 100%;
    max-width: 500px;
  }

  @media (max-width: 480px) {
    flex: 1;
    padding: 1rem;
    width: 100%;
    max-width: 400px;
  }

  form {
    width: 100%;
    max-width: 400px; // 最大宽度

    @media (max-width: 768px) {
      max-width: 400px;
    }

    @media (max-width: 480px) {
      max-width: 350px;
    }
  }

  .ant-form-item {
    margin-bottom: 16px;

    .ant-input-password {
      width: 100%; // 输入框占满容器宽度
    }
  }
`;

export const ImgIcon = styled.img`
  width: 1rem;
  height: 1rem;
  margin-right: 1rem;
`;
