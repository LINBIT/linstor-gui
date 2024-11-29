// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { AuthForm } from '@app/features/authentication';
import bgImg from '@app/assets/login_bg.png';
import logo from '@app/assets/login_logo.svg';
import { LoginContainer, LoginImg, LoginLeft, LoginRight, LoginTitle, Logo } from './styled';
import { useKVStore } from '@app/hooks';
import { useDispatch } from 'react-redux';
import { Dispatch } from '@app/store';

export const Login = () => {
  const store = useKVStore();

  const dispatch = useDispatch<Dispatch>();

  const { t } = useTranslation(['common']);

  const hideTip = () => {
    dispatch.setting.saveKey({
      hideDefaultCredential: true,
    });
  };

  const hideDefaultCredential = store?.hideDefaultCredential;

  return (
    <LoginContainer>
      <LoginLeft>
        <LoginImg src={bgImg} alt="background" />
      </LoginLeft>
      <LoginRight>
        <Logo src={logo} alt="logo" />
        <LoginTitle>{t('common:login')}</LoginTitle>
        {!hideDefaultCredential && (
          <Alert
            message="Default credential: admin/admin"
            type="info"
            closable
            style={{ width: 400, marginBottom: 20 }}
            onClose={hideTip}
          />
        )}
        <AuthForm />
      </LoginRight>
    </LoginContainer>
  );
};
