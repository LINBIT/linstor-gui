// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import styled from '@emotion/styled';

export const Content = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
`;

export const BGImg = styled.img`
  max-width: 522px;
  max-height: 620px;
  object-fit: cover;

  @media (max-width: 768px) {
    max-width: 320px;
    max-height: 400px;
  }

  @media (max-width: 480px) {
    max-width: 240px;
    max-height: 300px;
  }
`;

export const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  form {
    width: 100%;
    max-width: 400px; // 最大宽度

    @media (max-width: 768px) {
      max-width: 320px;
    }

    @media (max-width: 480px) {
      max-width: 260px;
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
