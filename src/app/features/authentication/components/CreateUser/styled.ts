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
  max-height: 80vh;
  background: transparent;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: auto;
    height: auto;
    max-height: none;
  }
`;

export const BGImg = styled.img`
  width: 45%;
  min-width: 400px;
  height: 100%;
  object-fit: cover;
  flex-shrink: 0;
  opacity: 0.2;

  @media (max-width: 1024px) {
    width: 40%;
    min-width: 350px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MainSection = styled.div`
  padding: 3rem 2rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;

  @media (max-width: 1024px) {
    padding: 2.5rem 2rem;
  }

  @media (max-width: 768px) {
    padding: 2rem;
    justify-content: center;
    flex: 1;
    width: 100%;
    max-width: 500px;
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
    flex: 1;
    width: 100%;
    max-width: 400px;
  }
`;

export const ImgIcon = styled.img`
  width: 1rem;
  height: 1rem;
  margin-right: 1rem;
`;

export const FormTitle = styled.h3`
  margin-bottom: 1.5rem;
  color: #262626;
  font-size: 1.5rem;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
`;

export const FormWrapper = styled.div`
  .ant-form-item-label > label {
    font-weight: 500;
    white-space: nowrap;
    overflow: visible;
  }

  .ant-form-item-label {
    padding-bottom: 8px;
  }

  .ant-btn-primary {
    width: 100%;
    height: 40px;
    margin-top: 1rem;
  }

  @media (max-width: 480px) {
    .ant-input,
    .ant-input-password {
      height: 40px;
    }

    .ant-form-item-label > label {
      font-size: 14px;
    }
  }
`;
