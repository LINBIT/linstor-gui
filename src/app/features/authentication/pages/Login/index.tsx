import React from 'react';
import { Alert } from 'antd';
import { AuthForm } from '@app/features/authentication';
import bgImg from '@app/assets/login_bg.png';
import logo from '@app/assets/login_logo.svg';
import { LoginContainer, LoginImg, LoginLeft, LoginRight, LoginTitle, Logo } from './styled';

export const Login = () => {
  return (
    <LoginContainer>
      <LoginLeft>
        <LoginImg src={bgImg} alt="background" />
      </LoginLeft>
      <LoginRight>
        <Logo src={logo} alt="logo" />
        <LoginTitle>Login</LoginTitle>
        <Alert message="Default credential: admin/admin" type="info" closable style={{ width: 400, marginBottom: 20}}/>
        <AuthForm />
      </LoginRight>
    </LoginContainer>
  );
};
